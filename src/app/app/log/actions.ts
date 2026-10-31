"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isLive } from "@/lib/matching";
import { getLibrary, getOwnTechniques, type Candidate, type OwnCandidate, type Position } from "@/lib/matching/library";
import { exactMatch, searchLibrary, searchList } from "@/lib/matching/search";
import { draftNames, mapFields } from "@/lib/admin/drafter";
import { MAX_BODY } from "@/lib/log-limits";
import { LEVELS, type Level, type MatchedTechnique, type Term } from "@/lib/mock/log-seed";
import { isIsoDate, seoulToday } from "@/lib/seoul-date";

// 기록 화면 — 기술을 먼저 고르고 오늘 메모(D-56). AI 정리하기는 없앴다.
// 목록 밖 이름은 사용자가 '내용 생성'으로 AI 기술 카드를 만들 수 있다 — 만든 사람만 보고, 운영자 승인 뒤 공용(D-57).

type Picked = Candidate & { ownerStatus?: OwnCandidate["ownerStatus"] };

// 고른 기술에 이미 정해 둔 숙련도를 붙인다 — 없거나 못 읽으면 비기너
async function withLevels(supabase: Supabase, found: Picked[]): Promise<MatchedTechnique[]> {
  if (!found.length) return [];
  const { data } = await supabase
    .from("technique_levels")
    .select("level, techniques!inner(slug)")
    .in(
      "techniques.slug",
      found.map((t) => t.slug),
    );
  const prev = new Map((data ?? []).map((r) => [r.techniques.slug, r.level as Level]));
  return found.map((t) => ({
    id: t.slug,
    nameKo: t.nameKo,
    nameEn: t.nameEn,
    position: t.position,
    positionSlug: t.positionSlug,
    steps: t.steps,
    level: prev.get(t.slug) ?? "beginner",
    draft: t.draft,
    ...(t.ownerStatus ? { mine: t.ownerStatus } : {}),
  }));
}

// 기술 고르기 — 이름 · 영어 이름 · 다른 이름으로 찾기 (D-31 · D-56). 내가 만든 기술이 먼저
export async function searchTechniques(query: string): Promise<MatchedTechnique[]> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || typeof query !== "string") return [];
  const q = query.slice(0, 40);
  const [lib, own] = await Promise.all([getLibrary(supabase), getOwnTechniques(supabase, user.id)]);
  const mine = searchList(own, q, 3);
  return withLevels(supabase, [...mine, ...searchLibrary(lib, q, 8 - mine.length)]);
}

export type PickerTechnique = MatchedTechnique & { aliases: string[] };
export type PickerData = { positions: { slug: string; nameKo: string }[]; techniques: PickerTechnique[] };

// 기술 고르기 전체(D-56, 속도) — 기록 화면을 열 때 한 번 받아 두고, 포지션 목록 · 검색은 브라우저에서 바로 한다.
// 공용 기술(포지션 순서) + 내가 만든 기술(그 포지션 맨 아래) + 내 숙련도.
export async function pickerData(): Promise<PickerData> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { positions: [], techniques: [] };
  const [lib, own, levels] = await Promise.all([
    getLibrary(supabase),
    getOwnTechniques(supabase, user.id),
    supabase.from("technique_levels").select("level, techniques!inner(slug)"),
  ]);
  const prev = new Map((levels.data ?? []).map((r) => [r.techniques.slug, r.level as Level]));
  const order = new Map(lib.positions.map((p, i) => [p.slug, i]));
  const all: Picked[] = [...lib.candidates, ...own].sort(
    (a, b) => (order.get(a.positionSlug) ?? 99) - (order.get(b.positionSlug) ?? 99),
  ); // 같은 포지션 안에서는 원래 순서(공용 → 내 것) 그대로
  const used = new Set(all.map((t) => t.positionSlug));
  return {
    positions: lib.positions.filter((p) => used.has(p.slug)),
    techniques: all.map((t) => ({
      id: t.slug,
      nameKo: t.nameKo,
      nameEn: t.nameEn,
      position: t.position,
      positionSlug: t.positionSlug,
      steps: t.steps,
      aliases: t.aliases,
      level: prev.get(t.slug) ?? "beginner",
      draft: t.draft,
      ...(t.ownerStatus ? { mine: t.ownerStatus } : {}),
    })),
  };
}

// 기술 카드 만들기 (D-57, 버튼 이름 2026-10-31) — 목록 밖 이름 하나를 AI 로 기술 카드로. 하루 3번(성공한 AI 호출만 셈).
// 이미 있는 기술과 이름이 똑같으면 AI 를 부르지 않고 그 기술을 돌려준다(비용 0).
// AI 가 만들지 못하면(모름 · 기술 이름 아님 · 오늘 횟수 다 씀 · 키 없음 · AI 호출 실패) 포지션 목록을 함께 돌려줘,
// 사용자가 관리자 화면처럼 포지션을 고르고 내용을 직접 적어 만들 수 있게 한다(createOwnTechnique, 2026-10-31 본인 요청).
const DAILY_USER_DRAFTS = 3;
export type GenerateResult =
  | { ok: true; kind: "new" | "existing"; technique: MatchedTechnique; left: number }
  | { ok: false; message: string; positions?: Position[] };

export async function generateTechnique(name: string): Promise<GenerateResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  const written = typeof name === "string" ? name.replace(/\s+/g, " ").trim().slice(0, 100) : "";
  if (!written) return { ok: false, message: "이름이 비었어요." };

  const [lib, own] = await Promise.all([getLibrary(supabase), getOwnTechniques(supabase, user.id)]);
  const same = exactMatch(own, written) ?? exactMatch(lib.candidates, written);
  if (same) {
    const [technique] = await withLevels(supabase, [same]);
    return { ok: true, kind: "existing", technique, left: -1 };
  }

  const manual = (message: string): GenerateResult => ({ ok: false, message, positions: lib.positions });
  if (!isLive()) return manual("AI 키가 없어 지금은 자동으로 만들 수 없어요. 아래에 직접 적어 만들 수 있어요.");
  const since = `${seoulToday()}T00:00:00+09:00`;
  const { count } = await supabase
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .eq("kind", "user_draft")
    .gte("called_at", since);
  const used = count ?? 0;
  if (used >= DAILY_USER_DRAFTS)
    return manual(`자동으로 만들기는 하루 ${DAILY_USER_DRAFTS}번이에요. 아래에 직접 적어 만들 수 있어요.`);

  let d;
  try {
    [d] = await draftNames([written], lib); // AI 에는 이름만 보낸다(글 · 누가 적었는지 안 보냄)
  } catch (e) {
    console.error("generateTechnique failed:", e instanceof Error ? e.name + " " + e.message.slice(0, 120) : "unknown");
    // AI 를 부르지 못해도(크레딧 부족 · 잠깐 장애) 직접 적어 만들 수 있게 한다
    return manual("지금은 AI 로 만들 수 없어요. 아래에 직접 적어 만들 수 있어요.");
  }
  const { error: countError } = await supabase.from("ai_calls").insert({ user_id: user.id, kind: "user_draft" });
  if (countError) console.error("ai_calls user_draft insert failed:", countError.code ?? "");
  const left = Math.max(0, DAILY_USER_DRAFTS - used - 1);

  // 이미 있는 기술의 다른 이름 → 그 기술로
  const target = d.kind === "alias" && d.aliasOf ? lib.bySlug.get(d.aliasOf) : undefined;
  if (target) {
    const [technique] = await withLevels(supabase, [target]);
    return { ok: true, kind: "existing", technique, left };
  }
  if (d.kind !== "new" || !d.position || !d.nameKo || !d.nameEn || d.steps.length < 3) {
    return manual(
      d.note.startsWith("확신 없음")
        ? `AI 가 이 기술을 정확히 몰라 지어내지 않았어요 — ${d.note.replace(/^확신 없음\s*[—-]?\s*/, "")}. 아래에 직접 적어 만들 수 있어요.`
        : `AI 가 기술 이름으로 보지 않았어요${d.note ? ` — ${d.note}` : ""}. 아래에 직접 적어 만들 수 있어요.`,
    );
  }

  const { data: pos } = await supabase.from("positions").select("id, slug, name_ko").eq("slug", d.position).maybeSingle();
  if (!pos) return { ok: false, message: "만들지 못했어요. 잠시 뒤 다시 눌러 주세요." };
  // 영문 키는 공용 기술과 겹치지 않게 뒤에 짧은 무작위 글자를 붙인다(승인할 때 운영자가 고칠 수 있음)
  const slug = `${(d.slug ?? "technique").slice(0, 50)}-${crypto.randomUUID().slice(0, 6)}`;
  const nk = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const aliases = [nk(d.nameKo), nk(d.nameEn), ...d.aliases.map(nk)].includes(nk(written))
    ? d.aliases
    : [...d.aliases, written];
  const { error } = await supabase.from("techniques").insert({
    owner_id: user.id,
    owner_status: "pending",
    is_reviewed: false,
    position_id: pos.id,
    slug,
    name_ko: d.nameKo,
    name_en: d.nameEn,
    aliases,
    steps: d.steps,
    source: "사용자 AI 생성(D-57)",
    sort_order: 9999,
    kind: d.techKind, // 기술 지도 칸(D-87) — 승인되면 그대로 공용이 된다
    ...mapFields(d),
  });
  if (error) {
    console.error("user technique insert failed:", error.code ?? "", (error.message ?? "").slice(0, 80));
    return { ok: false, message: "만든 내용을 저장하지 못했어요. 다시 눌러 주세요." };
  }
  revalidatePath("/app/skills"); // 내 기술 목록에 바로 보이게
  return {
    ok: true,
    kind: "new",
    left,
    technique: {
      id: slug,
      nameKo: d.nameKo,
      nameEn: d.nameEn,
      position: pos.name_ko,
      positionSlug: pos.slug,
      steps: d.steps,
      level: "beginner",
      draft: true,
      mine: "pending",
    },
  };
}

// 직접 적기 칸에 쓸 포지션 목록 — "직접 만들기" 버튼으로 AI 없이 바로 열 때(2026-10-31 본인 요청)
export async function techniquePositions(): Promise<Position[]> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return (await getLibrary(supabase)).positions;
}

// 직접 적어 기술 카드 만들기 (2026-10-31 본인 요청) — AI 가 만들지 못했을 때, 사용자가 포지션 · 이름 · 세팅 과정을 적는다.
// AI 를 부르지 않는다(비용 0). AI 로 만든 카드와 똑같이 나만 보이는 '승인 대기' 내 기술이 되고, 운영자가 고쳐 승인하면 공용이 된다.
// 영어 이름은 모르는 경우가 많아 한국어 이름을 그대로 넣어 두고(빈칸이면 유튜브 검색 · 화면이 어색해서), 운영자가 승인할 때 고친다.
export type OwnTechniqueInput = { position: string; nameKo: string; steps: string[] };
export async function createOwnTechnique(name: string, input: OwnTechniqueInput): Promise<GenerateResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
  const written = clean(name, 100);
  const nameKo = clean(input?.nameKo, 60) || written.slice(0, 60);
  const steps = (Array.isArray(input?.steps) ? input.steps : []).map((x) => clean(x, 120)).filter(Boolean).slice(0, 5);
  if (!nameKo) return { ok: false, message: "기술 이름을 적어 주세요." };
  if (steps.length < 1) return { ok: false, message: "세팅 과정을 한 줄 이상 적어 주세요." };
  const { data: pos } = await supabase.from("positions").select("id, slug, name_ko").eq("slug", clean(input?.position, 40)).maybeSingle();
  if (!pos) return { ok: false, message: "포지션을 골라 주세요." };

  const slug = `my-technique-${crypto.randomUUID().slice(0, 8)}`;
  const nk = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const { error } = await supabase.from("techniques").insert({
    owner_id: user.id,
    owner_status: "pending",
    is_reviewed: false,
    position_id: pos.id,
    slug,
    name_ko: nameKo,
    name_en: nameKo,
    aliases: written && nk(written) !== nk(nameKo) ? [written] : [],
    steps,
    source: "사용자 직접 입력",
    sort_order: 9999,
  });
  if (error) {
    console.error("own technique insert failed:", error.code ?? "", (error.message ?? "").slice(0, 80));
    return { ok: false, message: "저장하지 못했어요. 다시 눌러 주세요." };
  }
  revalidatePath("/app/skills");
  return {
    ok: true,
    kind: "new",
    left: -1,
    technique: {
      id: slug,
      nameKo,
      nameEn: nameKo,
      position: pos.name_ko,
      positionSlug: pos.slug,
      steps,
      level: "beginner",
      draft: true,
      mine: "pending",
    },
  };
}

export type SaveInput = {
  loggedOn: string; // YYYY-MM-DD (서울)
  body: string;
  aiStatus: "ok" | "mock" | "none"; // 새 기록은 none(D-56). 예전 기록은 정리하기 결과를 그대로
  techniques: { slug: string; level: Level }[];
  customNames: string[];
  terms: Term[];
  sparringRounds?: number; // 스파링 몇 판(D-64, 0~50)
};

export type SaveResult = { ok: true; linked: number } | { ok: false; message: string };

type Supabase = Awaited<ReturnType<typeof createSupabaseServer>>;
type DbError = { code?: string; message?: string } | null;
type Chosen = { id: string; level: Level };

const LEVEL_VALUES = new Set(LEVELS.map((l) => l.value));

// 들어온 값 검사 — 화면을 거치지 않은 요청도 막는다
function clean(input: SaveInput) {
  const today = seoulToday();
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (body.length > MAX_BODY) return null;
  const picks = (Array.isArray(input.techniques) ? input.techniques : [])
    .filter((t) => typeof t?.slug === "string" && LEVEL_VALUES.has(t.level))
    .slice(0, 12);
  const customNames = [
    ...new Set(
      (Array.isArray(input.customNames) ? input.customNames : [])
        .filter((n): n is string => typeof n === "string")
        .map((n) => n.trim().slice(0, 100))
        .filter(Boolean),
    ),
  ].slice(0, 10);
  const sparringRounds = Number.isInteger(input.sparringRounds) ? Math.min(50, Math.max(0, input.sparringRounds!)) : 0;
  if (!body && !picks.length && !customNames.length && !sparringRounds) return null; // 기술 · 메모 · 스파링 다 없으면 저장 안 함(D-56 · D-64)
  return {
    today,
    body,
    loggedOn: isIsoDate(input.loggedOn) && input.loggedOn <= today ? input.loggedOn : today,
    aiStatus: ["ok", "mock", "none"].includes(input.aiStatus) ? input.aiStatus : "none",
    picks,
    customNames,
    sparringRounds,
    terms: (Array.isArray(input.terms) ? input.terms : [])
      .filter((t) => typeof t?.term === "string" && typeof t?.meaning === "string")
      .slice(0, 6)
      .map(({ term, meaning }) => ({ term: term.slice(0, 30), meaning: meaning.slice(0, 80) })),
  };
}

// slug → id (없는 slug 는 버린다), 같은 기술은 한 번만
async function resolve(supabase: Supabase, picks: { slug: string; level: Level }[]) {
  const slugs = [...new Set(picks.map((p) => p.slug))];
  if (!slugs.length) return { chosen: [] as Chosen[], error: null };
  const { data, error } = await supabase.from("techniques").select("id, slug").in("slug", slugs);
  const idOf = new Map((data ?? []).map((r) => [r.slug, r.id]));
  const chosen = picks.filter((p) => idOf.has(p.slug)).map((p) => ({ id: idOf.get(p.slug)!, level: p.level }));
  return { chosen: [...new Map(chosen.map((c) => [c.id, c])).values()], error };
}

// 숙련도(기술마다 1줄, 이번 값으로). 복습 카드는 D-58 로 더 만들지 않는다(쌓인 카드는 DB 에 보관만)
async function saveLevels(supabase: Supabase, userId: string, chosen: Chosen[]) {
  if (!chosen.length) return { error: null as DbError, step: "" };
  const now = new Date().toISOString();
  const { error } = await supabase.from("technique_levels").upsert(
    chosen.map((c) => ({ user_id: userId, technique_id: c.id, level: c.level, updated_at: now })),
    { onConflict: "user_id,technique_id" },
  );
  return { error: error as DbError, step: "technique_levels" };
}

function links(userId: string, logId: string, chosen: Chosen[], customNames: string[]) {
  return [
    ...chosen.map((c) => ({ user_id: userId, class_log_id: logId, technique_id: c.id })),
    ...customNames.map((name) => ({ user_id: userId, class_log_id: logId, custom_name: name })),
  ];
}

// "저장" — 기록 1건 + 기술 연결 + 숙련도 (T-08 · DB.md, 복습 카드는 D-58 로 뺌)
export async function saveLog(input: SaveInput): Promise<SaveResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  const v = clean(input);
  if (!v) return { ok: false, message: "기술 · 스파링 · 메모 중 하나는 적어 주세요. 메모는 5000자까지예요." };

  const { chosen, error: findError } = await resolve(supabase, v.picks);
  if (findError) return fail("techniques", findError);

  // 1) 기록
  const { data: log, error: logError } = await supabase
    .from("class_logs")
    .insert({
      user_id: user.id,
      logged_on: v.loggedOn,
      body: v.body,
      terms: v.terms,
      ai_status: v.aiStatus,
      sparring_rounds: v.sparringRounds,
    })
    .select("id")
    .single();
  if (logError || !log) return fail("class_logs", logError);

  // 뒤 단계가 실패하면 기록을 지워(연결은 같이 지워짐) 다시 눌러도 기록이 두 번 생기지 않게 한다.
  // 숙련도 · 카드는 같은 값으로 다시 써도 되므로 남아도 괜찮다.
  const undo = async (step: string, error: DbError) => {
    await supabase.from("class_logs").delete().eq("id", log.id);
    return fail(step, error);
  };

  // 2) 기록 ↔ 기술 연결 (+ 목록에 없는 기술 이름)
  const rows = links(user.id, log.id, chosen, v.customNames);
  if (rows.length) {
    const { error } = await supabase.from("class_log_techniques").insert(rows);
    if (error) return undo("class_log_techniques", error);
  }

  // 3) 숙련도
  const r = await saveLevels(supabase, user.id, chosen);
  if (r.error) return undo(r.step, r.error);

  // 4) 온라인 오픈매트 알림(D-88) — 별명 + 기술 이름만, 끈 사람은 함수가 건너뛴다. 실패해도 저장은 그대로
  const { error: announceError } = await supabase.rpc("open_mat_announce", { p_log: log.id });
  if (announceError) console.error("open_mat_announce failed:", announceError.code ?? "");

  revalidatePath("/app", "layout"); // /app 아래 화면 전부(홈 · 내 기술 · 기록) 미리 불러온 내용까지 새로
  return { ok: true, linked: chosen.length };
}

// 저장한 기록 고치기 (D-25) — 글 · 용어 · 기술 연결 · 숙련도. 날짜는 그대로.
// 새로 들어온 기술은 숙련도를 쓰고, 뺀 기술이 다른 기록에도 없으면 숙련도를 지운다.
export async function updateLog(logId: string, input: SaveInput): Promise<SaveResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  const v = clean(input);
  if (!v) return { ok: false, message: "기술 · 스파링 · 메모 중 하나는 적어 주세요. 메모는 5000자까지예요." };
  if (typeof logId !== "string") return { ok: false, message: "기록을 찾지 못했어요." };

  // 본인 기록인지(RLS 로 남의 기록은 안 보인다) + 지금 연결
  const { data: log } = await supabase
    .from("class_logs")
    .select("id, class_log_techniques(technique_id, custom_name)")
    .eq("id", logId)
    .maybeSingle();
  if (!log) return { ok: false, message: "기록을 찾지 못했어요." };
  const before = log.class_log_techniques;

  const { chosen, error: findError } = await resolve(supabase, v.picks);
  if (findError) return fail("techniques", findError);

  const { error: updateError } = await supabase
    .from("class_logs")
    .update({ body: v.body, terms: v.terms, ai_status: v.aiStatus, sparring_rounds: v.sparringRounds })
    .eq("id", logId);
  if (updateError) return fail("class_logs update", updateError);

  // 연결 다시 쓰기 — 넣다가 실패하면 원래 연결을 되돌린다
  const { error: delError } = await supabase.from("class_log_techniques").delete().eq("class_log_id", logId);
  if (delError) return fail("class_log_techniques delete", delError);
  const rows = links(user.id, logId, chosen, v.customNames);
  if (rows.length) {
    const { error } = await supabase.from("class_log_techniques").insert(rows);
    if (error) {
      await supabase
        .from("class_log_techniques")
        .insert(before.map((b) => ({ user_id: user.id, class_log_id: logId, ...b })));
      return fail("class_log_techniques insert", error);
    }
  }

  const r = await saveLevels(supabase, user.id, chosen);
  if (r.error) return fail(r.step, r.error);

  // 뺀 기술 정리
  const now = new Set(chosen.map((c) => c.id));
  await dropOrphans(
    supabase,
    before.map((b) => b.technique_id).filter((id): id is string => !!id && !now.has(id)),
  );

  revalidatePath("/app", "layout"); // /app 아래 화면 전부(홈 · 내 기술 · 기록) 미리 불러온 내용까지 새로
  return { ok: true, linked: chosen.length };
}

// 기록에서 빠진 기술 정리 (D-25 · D-26) — 다른 기록에도 없는 기술의 숙련도를 지운다. 복습 카드는 건드리지 않는다(D-58, 보관).
// RLS 로 본인 것만 지워진다. 실패해도 기록 저장 · 삭제는 이미 끝났으므로 결과를 막지 않는다.
async function dropOrphans(supabase: Supabase, techniqueIds: string[]) {
  if (!techniqueIds.length) return;
  const { data: still } = await supabase
    .from("class_log_techniques")
    .select("technique_id")
    .in("technique_id", techniqueIds);
  const stillUsed = new Set((still ?? []).map((x) => x.technique_id));
  const drop = techniqueIds.filter((id) => !stillUsed.has(id));
  if (!drop.length) return;
  await supabase.from("technique_levels").delete().in("technique_id", drop);
}

export type DeleteResult = { ok: true } | { ok: false; message: string };

// 기록 지우기 (D-26) — 기록을 지우면 기술 연결은 같이 지워진다(cascade). 남의 기록은 RLS 로 안 보여 못 지운다.
export async function deleteLog(logId: string): Promise<DeleteResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  if (typeof logId !== "string") return { ok: false, message: "기록을 찾지 못했어요." };

  const { data: log } = await supabase
    .from("class_logs")
    .select("id, class_log_techniques(technique_id)")
    .eq("id", logId)
    .maybeSingle();
  if (!log) return { ok: false, message: "기록을 찾지 못했어요." };

  const { error } = await supabase.from("class_logs").delete().eq("id", logId);
  if (error) {
    console.error("deleteLog failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false, message: "지우지 못했어요. 잠시 뒤 다시 눌러 주세요." };
  }
  await dropOrphans(
    supabase,
    log.class_log_techniques.map((l) => l.technique_id).filter((id): id is string => !!id),
  );

  revalidatePath("/app", "layout"); // /app 아래 화면 전부(홈 · 내 기술 · 기록) 미리 불러온 내용까지 새로
  return { ok: true };
}

function fail(step: string, error: DbError): SaveResult {
  // 어느 단계 · 오류 코드만 남긴다(글 내용은 남기지 않는다)
  console.error("saveLog failed:", step, error?.code ?? "", (error?.message ?? "").slice(0, 120));
  return { ok: false, message: "저장하지 못했어요. 잠시 뒤 다시 눌러 주세요." };
}
