import "server-only";
import { createClient } from "@supabase/supabase-js";

// 리리롤 MCP(D-81)가 읽는 공용 기술 목록. 로그인 없이(anon) 공용 기술 · 포지션만 읽는다 — 사용자 표는 접근 규칙으로 막혀 있다.
// 함수 인스턴스마다 10분 동안 들고 있는다(목록은 마이그레이션 · 운영 승인으로만 바뀜).

export type Position = { slug: string; nameKo: string; nameEn: string; sort: number };
export type Technique = {
  slug: string;
  position: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  steps: string[];
  kind: string | null;
  role: string | null;
  endsAt: string[];
  keyPoints: string[];
  mistakes: string[];
  ifBlocked: string[];
  defense: string[];
};
export type Library = {
  positions: Position[];
  techniques: Technique[];
  posBySlug: Map<string, Position>;
  bySlug: Map<string, Technique>;
};

const TTL = 10 * 60 * 1000;
let cache: { at: number; lib: Promise<Library> } | null = null;

export function loadLibrary(): Promise<Library> {
  if (cache && Date.now() - cache.at < TTL) return cache.lib;
  const lib = fetchLibrary();
  cache = { at: Date.now(), lib };
  lib.catch(() => (cache = null)); // 실패하면 다음 요청에서 다시
  return lib;
}

async function fetchLibrary(): Promise<Library> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [pos, tech] = await Promise.all([
    supabase.from("positions").select("id, slug, name_ko, name_en, sort_order").order("sort_order"),
    supabase
      .from("techniques")
      .select("slug, position_id, name_ko, name_en, aliases, steps, kind, role, ends_at, key_points, mistakes, if_blocked, defense, sort_order")
      .is("owner_id", null)
      .order("sort_order"),
  ]);
  if (pos.error || tech.error) throw new Error("library");
  const posById = new Map(pos.data.map((p) => [p.id as string, p.slug as string]));
  const positions: Position[] = pos.data.map((p) => ({ slug: p.slug, nameKo: p.name_ko, nameEn: p.name_en, sort: p.sort_order }));
  const order = new Map(positions.map((p, i) => [p.slug, i]));
  const techniques: Technique[] = tech.data
    .map((t) => ({
      slug: t.slug,
      position: posById.get(t.position_id) ?? "",
      nameKo: t.name_ko,
      nameEn: t.name_en,
      aliases: t.aliases ?? [],
      steps: t.steps ?? [],
      kind: t.kind,
      role: t.role,
      endsAt: t.ends_at ?? [],
      keyPoints: t.key_points ?? [],
      mistakes: t.mistakes ?? [],
      ifBlocked: t.if_blocked ?? [],
      defense: t.defense ?? [],
    }))
    .sort((a, b) => (order.get(a.position) ?? 99) - (order.get(b.position) ?? 99));
  return {
    positions,
    techniques,
    posBySlug: new Map(positions.map((p) => [p.slug, p])),
    bySlug: new Map(techniques.map((t) => [t.slug, t])),
  };
}
