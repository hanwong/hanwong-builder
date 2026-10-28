"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isLive } from "@/lib/matching";
import { getLibrary, getOwnTechniques, type Candidate, type OwnCandidate } from "@/lib/matching/library";
import { exactMatch, searchLibrary, searchList } from "@/lib/matching/search";
import { draftNames } from "@/lib/admin/drafter";
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

export type PickerPosition = { slug: string; nameKo: string; count: number };

// 기술 고르기 첫 화면 — 포지션 그림 칸(순서 = 포지션 sort_order) (D-56)
export async function pickerPositions(): Promise<PickerPosition[]> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const [lib, own] = await Promise.all([getLibrary(supabase), getOwnTechniques(supabase, user.id)]);
  const count = new Map<string, number>();
  for (const t of [...lib.candidates, ...own]) count.set(t.positionSlug, (count.get(t.positionSlug) ?? 0) + 1);
  return lib.positions.filter((p) => count.has(p.slug)).map((p) => ({ ...p, count: count.get(p.slug)! }));
}

// 포지션 그림을 누르면 — 그 포지션 기술 전부 + 내가 만든 기술(맨 아래) (D-56 · D-57)
export async function positionTechniques(positionSlug: string): Promise<MatchedTechnique[]> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || typeof positionSlug !== "string") return [];
  const [lib, own] = await Promise.all([getLibrary(supabase), getOwnTechniques(supabase, user.id)]);
  return withLevels(
    supabase,
    [...lib.candidates, ...own].filter((t) => t.positionSlug === positionSlug),
  );
}

// 내용 생성 (D-57) — 목록 밖 이름 하나를 AI 로 기술 카드로. 하루 3번(성공한 AI 호출만 셈).
// 이미 있는 기술과 이름이 똑같으면 AI 를 부르지 않고 그 기술을 돌려준다(비용 0).
const DAILY_USER_DRAFTS = 3;
export type GenerateResult =
  | { ok: true; kind: "new" | "existing"; technique: MatchedTechnique; left: number }
  | { ok: false; message: string };

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

  if (!isLive()) return { ok: false, message: "AI 키가 없어 지금은 만들 수 없어요(연습용 예시)." };
  const since = `${seoulToday()}T00:00:00+09:00`;
  const { count } = await supabase
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .eq("kind", "user_draft")
    .gte("called_at", since);
  const used = count ?? 0;
  if (used >= DAILY_USER_DRAFTS)
    return { ok: false, message: `내용 생성은 하루 ${DAILY_USER_DRAFTS}번이에요. 내일 다시 눌러 주세요.` };

  let d;
  try {
    [d] = await draftNames([written], lib); // AI 에는 이름만 보낸다(글 · 누가 적었는지 안 보냄)
  } catch (e) {
    console.error("generateTechnique failed:", e instanceof Error ? e.name + " " + e.message.slice(0, 120) : "unknown");
    return { ok: false, message: "만들지 못했어요. 잠시 뒤 다시 눌러 주세요." };
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
    return {
      ok: false,
      message: `기술 이름으로 보기 어려워 만들지 않았어요${d.note ? ` — ${d.note}` : ""}. 이름은 그대로 남아요.`,
    };
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

export type SaveInput = {
  loggedOn: string; // YYYY-MM-DD (서울)
  body: string;
  aiStatus: "ok" | "mock" | "none"; // 새 기록은 none(D-56). 예전 기록은 정리하기 결과를 그대로
  techniques: { slug: string; level: Level }[];
  customNames: string[];
  terms: Term[];
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
  if (!body && !picks.length && !customNames.length) return null; // 기술도 메모도 없으면 저장 안 함(D-56)
  return {
    today,
    body,
    loggedOn: isIsoDate(input.loggedOn) && input.loggedOn <= today ? input.loggedOn : today,
    aiStatus: ["ok", "mock", "none"].includes(input.aiStatus) ? input.aiStatus : "none",
    picks,
    customNames,
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
  if (!v) return { ok: false, message: "기술을 고르거나 메모를 적어 주세요. 메모는 5000자까지예요." };

  const { chosen, error: findError } = await resolve(supabase, v.picks);
  if (findError) return fail("techniques", findError);

  // 1) 기록
  const { data: log, error: logError } = await supabase
    .from("class_logs")
    .insert({ user_id: user.id, logged_on: v.loggedOn, body: v.body, terms: v.terms, ai_status: v.aiStatus })
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
  if (!v) return { ok: false, message: "기술을 고르거나 메모를 적어 주세요. 메모는 5000자까지예요." };
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
    .update({ body: v.body, terms: v.terms, ai_status: v.aiStatus })
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
