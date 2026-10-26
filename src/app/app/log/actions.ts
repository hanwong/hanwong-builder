"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { matchLog } from "@/lib/matching";
import type { OrganizeResult } from "@/lib/matching/types";
import { MAX_BODY } from "@/lib/log-limits";
import { LEVELS, type Level, type Term } from "@/lib/mock/log-seed";
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

export type SaveInput = {
  loggedOn: string; // YYYY-MM-DD (서울)
  body: string;
  aiStatus: "ok" | "mock" | "none"; // none = 정리 실패 뒤 "그냥 저장"
  techniques: { slug: string; level: Level }[];
  customNames: string[];
  terms: Term[];
};

export type SaveResult = { ok: true; newCards: number; linked: number } | { ok: false; message: string };

const LEVEL_VALUES = new Set(LEVELS.map((l) => l.value));

// "저장" — 기록 1건 + 기술 연결 + 숙련도 + 복습 카드(기술당 1장, 다음 복습 = 내일 서울) (T-08 · DB.md · D-09)
export async function saveLog(input: SaveInput): Promise<SaveResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };

  // 들어온 값 검사 — 화면을 거치지 않은 요청도 막는다
  const today = seoulToday();
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body || body.length > MAX_BODY) return { ok: false, message: "글이 비었거나 너무 길어요." };
  const loggedOn = isIsoDate(input.loggedOn) && input.loggedOn <= today ? input.loggedOn : today;
  const aiStatus = ["ok", "mock", "none"].includes(input.aiStatus) ? input.aiStatus : "none";
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
  const terms = (Array.isArray(input.terms) ? input.terms : [])
    .filter((t) => typeof t?.term === "string" && typeof t?.meaning === "string")
    .slice(0, 6)
    .map(({ term, meaning }) => ({ term: term.slice(0, 30), meaning: meaning.slice(0, 80) }));

  // slug → id (없는 slug 는 버린다)
  const slugs = [...new Set(picks.map((p) => p.slug))];
  const { data: rows, error: findError } = slugs.length
    ? await supabase.from("techniques").select("id, slug").in("slug", slugs)
    : { data: [], error: null };
  if (findError) return fail("techniques", findError);
  const idOf = new Map((rows ?? []).map((r) => [r.slug, r.id]));
  const chosen = picks.filter((p) => idOf.has(p.slug)).map((p) => ({ id: idOf.get(p.slug)!, level: p.level }));
  const uniqueChosen = [...new Map(chosen.map((c) => [c.id, c])).values()];

  // 1) 기록
  const { data: log, error: logError } = await supabase
    .from("class_logs")
    .insert({ user_id: user.id, logged_on: loggedOn, body, terms, ai_status: aiStatus })
    .select("id")
    .single();
  if (logError || !log) return fail("class_logs", logError);

  // 뒤 단계가 실패하면 기록을 지워(연결은 같이 지워짐) 다시 눌러도 기록이 두 번 생기지 않게 한다.
  // 숙련도 · 카드는 같은 값으로 다시 써도 되므로 남아도 괜찮다.
  const undo = async (logId: string, step: string, error: { code?: string; message?: string }) => {
    await supabase.from("class_logs").delete().eq("id", logId);
    return fail(step, error);
  };

  // 2) 기록 ↔ 기술 연결 (+ 목록에 없는 기술 이름)
  const links = [
    ...uniqueChosen.map((c) => ({ user_id: user.id, class_log_id: log.id, technique_id: c.id })),
    ...customNames.map((name) => ({ user_id: user.id, class_log_id: log.id, custom_name: name })),
  ];
  if (links.length) {
    const { error } = await supabase.from("class_log_techniques").insert(links);
    if (error) return undo(log.id, "class_log_techniques", error);
  }

  if (uniqueChosen.length) {
    // 3) 숙련도 — 기술마다 1줄, 이번에 고른 값으로 바꾼다
    const now = new Date().toISOString();
    const { error: levelError } = await supabase.from("technique_levels").upsert(
      uniqueChosen.map((c) => ({ user_id: user.id, technique_id: c.id, level: c.level, updated_at: now })),
      { onConflict: "user_id,technique_id" },
    );
    if (levelError) return undo(log.id, "technique_levels", levelError);

    // 4) 복습 카드 — 기술당 1장. 이미 있으면 그대로 둔다(간격 단계 · 복습일 유지)
    const { data: created, error: cardError } = await supabase
      .from("review_cards")
      .upsert(
        uniqueChosen.map((c) => ({ user_id: user.id, technique_id: c.id, interval_step: 0, due_on: addDays(today, 1) })),
        { onConflict: "user_id,technique_id", ignoreDuplicates: true },
      )
      .select("id");
    if (cardError) return undo(log.id, "review_cards", cardError);
    return { ok: true, newCards: created?.length ?? 0, linked: uniqueChosen.length };
  }

  return { ok: true, newCards: 0, linked: 0 };
}

function fail(step: string, error: { code?: string; message?: string } | null): SaveResult {
  // 어느 단계 · 오류 코드만 남긴다(글 내용은 남기지 않는다)
  console.error("saveLog failed:", step, error?.code ?? "", (error?.message ?? "").slice(0, 120));
  return { ok: false, message: "저장하지 못했어요. 잠시 뒤 다시 눌러 주세요." };
}
