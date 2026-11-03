import "server-only";
import { seoulToday } from "@/lib/seoul-date";
import type { createSupabaseServer } from "@/lib/supabase/server";

// 질문하기 하루 횟수(D-115) — 사용자 3번 · 운영자 30번(시험용 안전장치). 성공한 답만 ai_calls(kind ask)로 센다.
export const USER_DAILY_ASKS = 3;
const OPERATOR_DAILY_ASKS = 30;

type Client = Awaited<ReturnType<typeof createSupabaseServer>>;

export async function askQuota(supabase: Client): Promise<{ limit: number; used: number; left: number }> {
  const [{ data: operator }, { count }] = await Promise.all([
    supabase.rpc("is_operator"),
    supabase
      .from("ai_calls")
      .select("id", { count: "exact", head: true })
      .eq("kind", "ask")
      .gte("called_at", `${seoulToday()}T00:00:00+09:00`),
  ]);
  const limit = operator ? OPERATOR_DAILY_ASKS : USER_DAILY_ASKS;
  const used = count ?? 0;
  return { limit, used, left: Math.max(0, limit - used) };
}
