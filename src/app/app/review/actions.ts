"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addDays, seoulToday } from "@/lib/seoul-date";
import { INTERVAL_DAYS, nextStep, type Rating } from "@/lib/review-rules";

export type AnswerResult = { ok: true; dueOn: string } | { ok: false; message: string };

const RATING_VALUES = new Set<Rating>(["again", "hard", "good", "easy"]);

// 카드 한 장에 답하기 (T-09 · D-09) — 다음 단계 · 복습일을 서버에서 계산하고 응답을 review_logs 에 남긴다.
export async function answerCard(cardId: string, rating: Rating): Promise<AnswerResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  if (typeof cardId !== "string" || !RATING_VALUES.has(rating)) return { ok: false, message: "잘못된 요청이에요." };

  const today = seoulToday();
  const { data: card } = await supabase
    .from("review_cards")
    .select("id, interval_step, due_on, reviews_count")
    .eq("id", cardId)
    .maybeSingle();
  if (!card) return { ok: false, message: "카드를 찾지 못했어요." };
  // 두 번 눌러도 한 번만 — 이미 오늘 이후로 밀린 카드는 다시 계산하지 않는다
  if (card.due_on > today) return { ok: true, dueOn: card.due_on };

  const prev = card.interval_step;
  const next = nextStep(prev, rating);
  const dueOn = addDays(today, INTERVAL_DAYS[next]);

  const { error: updateError } = await supabase
    .from("review_cards")
    .update({
      interval_step: next,
      due_on: dueOn,
      reviews_count: card.reviews_count + 1,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", cardId);
  if (updateError) return fail("review_cards", updateError);

  const { error: logError } = await supabase
    .from("review_logs")
    .insert({ user_id: user.id, review_card_id: cardId, rating, prev_step: prev, next_step: next });
  if (logError) return fail("review_logs", logError); // 카드는 이미 넘어갔다 — 응답 기록만 빠진다

  revalidatePath("/app", "layout"); // /app 아래 화면 전부(홈 · 복습 · 내 기술 · 기록) 미리 불러온 내용까지 새로
  return { ok: true, dueOn };
}

function fail(step: string, error: { code?: string; message?: string }): AnswerResult {
  console.error("answerCard failed:", step, error.code ?? "", (error.message ?? "").slice(0, 120));
  return { ok: false, message: "저장 못 했어요 — 다시 눌러 주세요." };
}
