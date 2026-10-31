"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isLive } from "@/lib/matching";
import { answerQuestion } from "@/lib/ask/answer";
import { seoulToday } from "@/lib/seoul-date";

// 질문하기 (D-100) — 지금은 운영자만. 성공한 답만 저장하고 ai_calls(kind ask)로 센다.
const DAILY_ASKS = 30; // 운영자 안전장치

export type AskResult = { ok: true; id: string } | { ok: false; message: string };

export async function askQuestion(text: string): Promise<AskResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  const { data: operator } = await supabase.rpc("is_operator");
  if (!operator) return { ok: false, message: "질문하기는 아직 준비 중이에요." };

  const question = typeof text === "string" ? text.replace(/\s+/g, " ").trim().slice(0, 500) : "";
  if (question.length < 2) return { ok: false, message: "질문을 두 글자 이상 적어 주세요." };
  if (!isLive()) return { ok: false, message: "AI 키가 없어 지금은 답을 만들 수 없어요." };

  const since = `${seoulToday()}T00:00:00+09:00`;
  const { count } = await supabase
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .eq("kind", "ask")
    .gte("called_at", since);
  if ((count ?? 0) >= DAILY_ASKS) return { ok: false, message: "오늘은 여기까지 — 내일 다시 물어봐 주세요." };

  let a;
  try {
    a = await answerQuestion(question);
  } catch (e) {
    console.error("askQuestion failed:", e instanceof Error ? e.name + " " + e.message.slice(0, 120) : "unknown");
    return { ok: false, message: "답을 만들지 못했어요 — 다시 눌러 주세요." };
  }
  const { error: countError } = await supabase.from("ai_calls").insert({ user_id: user.id, kind: "ask" });
  if (countError) console.error("ai_calls ask insert failed:", countError.code ?? "");

  const { data, error } = await supabase
    .from("questions")
    .insert({ user_id: user.id, asked_on: seoulToday(), question, answer: a.answer, slugs: a.slugs })
    .select("id")
    .single();
  if (error || !data) {
    console.error("questions insert failed:", error?.code ?? "", (error?.message ?? "").slice(0, 120));
    return { ok: false, message: "답은 만들었는데 저장하지 못했어요. 다시 눌러 주세요." };
  }
  revalidatePath("/app", "layout"); // 기록 목록 · 달력에 바로 보이게
  return { ok: true, id: data.id };
}

export async function deleteQuestion(id: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createSupabaseServer();
  if (typeof id !== "string") return { ok: false, message: "질문을 찾지 못했어요." };
  const { error, count } = await supabase.from("questions").delete({ count: "exact" }).eq("id", id);
  if (error || !count) return { ok: false, message: "지우지 못했어요. 잠시 뒤 다시 눌러 주세요." };
  revalidatePath("/app", "layout");
  return { ok: true };
}
