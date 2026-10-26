"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { matchLog } from "@/lib/matching";
import { searchLibrary } from "@/lib/matching/search";
import type { OrganizeResult } from "@/lib/matching/types";
import { MAX_BODY } from "@/lib/log-limits";
import { LEVELS, type Level, type MatchedTechnique, type Term } from "@/lib/mock/log-seed";
import { addDays, isIsoDate, seoulToday } from "@/lib/seoul-date";

// "정리하기" — 글에서 기술 · 용어를 찾는다(T-06). 저장은 하지 않는다.
// 이미 숙련도를 정해 둔 기술은 그 값을 기본값으로 돌려준다(FLOW 상태 C, T-08).
export async function organizeLog(body: string): Promise<OrganizeResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };

  const text = typeof body === "string" ? body.trim() : "";
  if (!text) return { ok: false, message: "글을 먼저 적어 주세요." };
  if (text.length > MAX_BODY) return { ok: false, message: `글은 ${MAX_BODY}자까지 정리할 수 있어요.` };

  let result: Extract<OrganizeResult, { ok: true }>;
  try {
    result = await matchLog(text);
  } catch (e) {
    // 원인(오류 종류)만 서버 로그에 남긴다. 글 내용 · 키는 남기지 않는다.
    console.error("organizeLog failed:", e instanceof Error ? e.name + " " + e.message.slice(0, 120) : "unknown");
    return { ok: false, message: "잠시 뒤 다시 시도해 주세요." };
  }

  // 이전 숙련도 — 없거나 못 읽으면 비기너 그대로
  const slugs = result.techniques.map((t) => t.id);
  if (slugs.length) {
    const { data } = await supabase
      .from("technique_levels")
      .select("level, techniques!inner(slug)")
      .in("techniques.slug", slugs);
    const prev = new Map((data ?? []).map((r) => [r.techniques.slug, r.level as Level]));
    result.techniques = result.techniques.map((t) => ({ ...t, level: prev.get(t.id) ?? t.level }));
  }
  return result;
}

// 정리 화면 "기술 추가" 검색 (D-31) — 우리 목록에서 찾고, 이미 정해 둔 숙련도가 있으면 그 값으로 돌려준다.
export async function searchTechniques(query: string): Promise<MatchedTechnique[]> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || typeof query !== "string") return [];

  const found = searchLibrary(query.slice(0, 40));
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
    steps: t.steps,
    level: prev.get(t.slug) ?? "beginner",
    draft: t.draft,
  }));
}

export type SaveInput = {
  loggedOn: string; // YYYY-MM-DD (서울)
  body: string;
  aiStatus: "ok" | "mock" | "none"; // none = 정리 실패 뒤 "그냥 저장"
  techniques: { slug: string; level: Level }[];
  customNames: string[];
  terms: Term[];
};

export type SaveResult = { ok: true; newCards: number; linked: number } | { ok: false; message: string };

type Supabase = Awaited<ReturnType<typeof createSupabaseServer>>;
type DbError = { code?: string; message?: string } | null;
type Chosen = { id: string; level: Level };

const LEVEL_VALUES = new Set(LEVELS.map((l) => l.value));

// 들어온 값 검사 — 화면을 거치지 않은 요청도 막는다
function clean(input: SaveInput) {
  const today = seoulToday();
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body || body.length > MAX_BODY) return null;
  return {
    today,
    body,
    loggedOn: isIsoDate(input.loggedOn) && input.loggedOn <= today ? input.loggedOn : today,
    aiStatus: ["ok", "mock", "none"].includes(input.aiStatus) ? input.aiStatus : "none",
    picks: (Array.isArray(input.techniques) ? input.techniques : [])
      .filter((t) => typeof t?.slug === "string" && LEVEL_VALUES.has(t.level))
      .slice(0, 12),
    customNames: [
      ...new Set(
        (Array.isArray(input.customNames) ? input.customNames : [])
          .filter((n): n is string => typeof n === "string")
          .map((n) => n.trim().slice(0, 100))
          .filter(Boolean),
      ),
    ].slice(0, 10),
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

// 숙련도(기술마다 1줄, 이번 값으로) + 복습 카드(기술당 1장, 이미 있으면 그대로 — 간격 단계 · 복습일 유지)
async function levelsAndCards(supabase: Supabase, userId: string, chosen: Chosen[], today: string) {
  if (!chosen.length) return { newCards: 0, error: null as DbError, step: "" };
  const now = new Date().toISOString();
  const { error: levelError } = await supabase.from("technique_levels").upsert(
    chosen.map((c) => ({ user_id: userId, technique_id: c.id, level: c.level, updated_at: now })),
    { onConflict: "user_id,technique_id" },
  );
  if (levelError) return { newCards: 0, error: levelError as DbError, step: "technique_levels" };
  const { data, error } = await supabase
    .from("review_cards")
    .upsert(
      chosen.map((c) => ({ user_id: userId, technique_id: c.id, interval_step: 0, due_on: addDays(today, 1) })),
      { onConflict: "user_id,technique_id", ignoreDuplicates: true },
    )
    .select("id");
  return { newCards: data?.length ?? 0, error: error as DbError, step: "review_cards" };
}

function links(userId: string, logId: string, chosen: Chosen[], customNames: string[]) {
  return [
    ...chosen.map((c) => ({ user_id: userId, class_log_id: logId, technique_id: c.id })),
    ...customNames.map((name) => ({ user_id: userId, class_log_id: logId, custom_name: name })),
  ];
}

// "저장" — 기록 1건 + 기술 연결 + 숙련도 + 복습 카드(기술당 1장, 다음 복습 = 내일 서울) (T-08 · DB.md · D-09)
export async function saveLog(input: SaveInput): Promise<SaveResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  const v = clean(input);
  if (!v) return { ok: false, message: "글이 비었거나 너무 길어요." };

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

  // 3) 숙련도 · 4) 복습 카드
  const r = await levelsAndCards(supabase, user.id, chosen, v.today);
  if (r.error) return undo(r.step, r.error);

  revalidatePath("/app"); // 홈의 오늘 복습 · 최근 기록을 새로
  return { ok: true, newCards: r.newCards, linked: chosen.length };
}

// 저장한 기록 고치기 (D-25) — 글 · 용어 · 기술 연결 · 숙련도. 날짜는 그대로.
// 새로 들어온 기술은 카드를 만들고, 뺀 기술이 다른 기록에도 없고 한 번도 복습 안 한 카드면 카드 · 숙련도를 지운다.
export async function updateLog(logId: string, input: SaveInput): Promise<SaveResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  const v = clean(input);
  if (!v) return { ok: false, message: "글이 비었거나 너무 길어요." };
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

  const r = await levelsAndCards(supabase, user.id, chosen, v.today);
  if (r.error) return fail(r.step, r.error);

  // 뺀 기술 정리
  const now = new Set(chosen.map((c) => c.id));
  await dropOrphans(
    supabase,
    before.map((b) => b.technique_id).filter((id): id is string => !!id && !now.has(id)),
  );

  revalidatePath("/app");
  revalidatePath(`/app/log/${logId}`);
  return { ok: true, newCards: r.newCards, linked: chosen.length };
}

// 기록에서 빠진 기술 정리 (D-25 · D-26) — 다른 기록에도 없고, 카드를 아직 한 번도 안 풀었을 때만 카드 · 숙련도를 지운다.
// RLS 로 본인 것만 지워진다. 실패해도 기록 저장 · 삭제는 이미 끝났으므로 결과를 막지 않는다.
async function dropOrphans(supabase: Supabase, techniqueIds: string[]) {
  if (!techniqueIds.length) return;
  const { data: still } = await supabase
    .from("class_log_techniques")
    .select("technique_id")
    .in("technique_id", techniqueIds);
  const stillUsed = new Set((still ?? []).map((x) => x.technique_id));
  const orphan = techniqueIds.filter((id) => !stillUsed.has(id));
  if (!orphan.length) return;
  const { data: reviewed } = await supabase
    .from("review_cards")
    .select("technique_id")
    .in("technique_id", orphan)
    .gt("reviews_count", 0);
  const keep = new Set((reviewed ?? []).map((x) => x.technique_id));
  const drop = orphan.filter((id) => !keep.has(id));
  if (!drop.length) return;
  await supabase.from("review_cards").delete().in("technique_id", drop);
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

  revalidatePath("/app");
  revalidatePath("/app/review");
  return { ok: true };
}

function fail(step: string, error: DbError): SaveResult {
  // 어느 단계 · 오류 코드만 남긴다(글 내용은 남기지 않는다)
  console.error("saveLog failed:", step, error?.code ?? "", (error?.message ?? "").slice(0, 120));
  return { ok: false, message: "저장하지 못했어요. 잠시 뒤 다시 눌러 주세요." };
}
