import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import data from "../../../data/techniques.json";

// 매칭 · 검색 후보 = 기술 라이브러리. 원본은 DB techniques(D-47) — 운영 화면에서 승인한 기술이 바로 들어온다.
// 서버마다 5분 보관하고(LIBRARY_TTL), DB 를 못 읽으면 data/techniques.json(사본)으로 대신한다.
// 검수된 기술이 MIN_REVIEWED 개가 되기 전에는 검수 전 초안도 후보로 쓰고, 화면에 "검수 전" 을 붙인다(D-21).

export const MIN_REVIEWED = 20; // M1 최소 검수 개수(TASKS T-01c)
const LIBRARY_TTL = 5 * 60_000;

export type Candidate = {
  slug: string;
  nameKo: string;
  nameEn: string;
  position: string; // 포지션 한국어 이름
  positionSlug: string;
  aliases: string[];
  steps: string[];
  draft: boolean;
  kind: string | null; // 종류(D-81) — 서브미션 · 스윕 · 패스 … 기술 고르기의 '무엇을 했어요?'(D-96)
};

export type Position = { slug: string; nameKo: string };

export type Library = {
  candidates: Candidate[];
  bySlug: Map<string, Candidate>;
  positions: Position[];
  // "남북 (노스사우스)" · "하프가드" 처럼 글에 포지션만 나온 경우를 가리기 위한 이름들
  positionNames: string[];
  includesDrafts: boolean;
};

function build(positions: Position[], all: Candidate[]): Library {
  const reviewed = all.filter((t) => !t.draft);
  const includesDrafts = reviewed.length < MIN_REVIEWED;
  const candidates = includesDrafts ? all : reviewed;
  return {
    candidates,
    bySlug: new Map(candidates.map((t) => [t.slug, t])),
    positions,
    positionNames: positions.flatMap((p) => [p.nameKo, ...p.nameKo.split(/ [·(] ?|\)/)]).filter(Boolean),
    includesDrafts,
  };
}

function fromJson(): Library {
  const positions = data.positions.map((p) => ({ slug: p.slug, nameKo: p.name_ko }));
  const name = new Map(positions.map((p) => [p.slug, p.nameKo]));
  return build(
    positions,
    data.techniques.map((t) => ({
      slug: t.slug,
      nameKo: t.name_ko,
      nameEn: t.name_en,
      position: name.get(t.position) ?? t.position,
      positionSlug: t.position,
      aliases: t.aliases,
      steps: t.steps,
      draft: t.draft !== false,
      kind: t.kind ?? null,
    })),
  );
}

async function fromDb(supabase: SupabaseClient<Database>): Promise<Library> {
  const [pos, tech] = await Promise.all([
    supabase.from("positions").select("id, slug, name_ko, sort_order").order("sort_order"),
    supabase
      .from("techniques")
      .select("slug, name_ko, name_en, aliases, steps, is_reviewed, sort_order, position_id, kind")
      .is("owner_id", null) // 사용자가 만든 '내 기술'(D-57)은 공용 목록 · 캐시에 넣지 않는다
      .range(0, 9999),
  ]);
  if (pos.error || tech.error || !pos.data.length || !tech.data.length) throw new Error("library read failed");
  const order = new Map(pos.data.map((p, i) => [p.id, i]));
  const byId = new Map(pos.data.map((p) => [p.id, p]));
  const rows = [...tech.data].sort(
    (a, b) => (order.get(a.position_id) ?? 99) - (order.get(b.position_id) ?? 99) || a.sort_order - b.sort_order,
  );
  return build(
    pos.data.map((p) => ({ slug: p.slug, nameKo: p.name_ko })),
    rows.map((t) => {
      const p = byId.get(t.position_id);
      return {
        slug: t.slug,
        nameKo: t.name_ko,
        nameEn: t.name_en,
        position: p?.name_ko ?? "",
        positionSlug: p?.slug ?? "",
        aliases: t.aliases ?? [],
        steps: t.steps,
        draft: !t.is_reviewed,
        kind: t.kind,
      };
    }),
  );
}

let memo: { lib: Library; at: number } | null = null;

// 로그인한 사람의 Supabase 로 읽는다(techniques 는 로그인하면 누구나 보기, DB.md 5). 기술 목록은 공용이라 사람끼리 같이 쓴다.
export async function getLibrary(supabase: SupabaseClient<Database>): Promise<Library> {
  if (memo && Date.now() - memo.at < LIBRARY_TTL) return memo.lib;
  try {
    memo = { lib: await fromDb(supabase), at: Date.now() };
  } catch (e) {
    console.error("getLibrary: DB 대신 JSON 사본을 쓴다", e instanceof Error ? e.message : "");
    memo = { lib: memo?.lib ?? fromJson(), at: Date.now() - LIBRARY_TTL + 30_000 }; // 30초 뒤 다시 시도
  }
  return memo.lib;
}

// 내가 만든 기술(D-57) — 만든 사람에게만 보이고 공용 목록(위 캐시)에는 없다. 사람마다 그때그때 읽는다.
export type OwnCandidate = Candidate & { ownerStatus: "pending" | "rejected" };

export async function getOwnTechniques(supabase: SupabaseClient<Database>, userId: string): Promise<OwnCandidate[]> {
  const { data, error } = await supabase
    .from("techniques")
    .select("slug, name_ko, name_en, aliases, steps, owner_status, positions(slug, name_ko)")
    .eq("owner_id", userId)
    .order("created_at");
  if (error) return [];
  return data.map((t) => ({
    slug: t.slug,
    nameKo: t.name_ko,
    nameEn: t.name_en,
    position: t.positions?.name_ko ?? "",
    positionSlug: t.positions?.slug ?? "",
    aliases: t.aliases ?? [],
    steps: t.steps,
    draft: true,
    kind: null,
    ownerStatus: t.owner_status === "rejected" ? "rejected" : "pending",
  }));
}

// 승인 직후 이 서버에서는 바로 새 목록을 읽게 한다(다른 서버는 5분 안에)
export function forgetLibrary() {
  memo = null;
}
