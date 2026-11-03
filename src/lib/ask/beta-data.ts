import "server-only";
import { createSupabaseServer } from "@/lib/supabase/server";
import { askQuota } from "@/lib/ask/quota";

// 질문 메인 시험 홈(D-115) — 오늘 남은 횟수 · 지도가 자라는 숫자(map_growth, 숫자와 공용 기술 이름만) · 내 최근 질문.
export type Growth = {
  total: number;
  added7d: number;
  fromQuestions: number;
  daily: number[]; // 최근 14일 날마다 들어간 공용 기술 수 — 오래된 날부터, 마지막이 오늘
  lastRun: { runOn: string; questions: number; drafted: number } | null;
  recent: { slug: string; name: string; position: string | null }[];
};
export type BetaData = {
  left: number;
  limit: number;
  growth: Growth | null;
  myCount: number;
  mine: { id: string; askedOn: string; question: string }[];
};

type RawGrowth = {
  total: number;
  added_7d: number;
  from_questions: number;
  daily: number[] | null;
  last_run: { run_on: string; questions: number; drafted: number } | null;
  recent: { slug: string; name: string; position: string | null }[];
};

export async function getBetaData(): Promise<BetaData> {
  const supabase = await createSupabaseServer();
  const [quota, growth, mine] = await Promise.all([
    askQuota(supabase),
    supabase.rpc("map_growth"),
    supabase
      .from("questions")
      .select("id, asked_on, question", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (mine.error) throw new Error(`beta: ${mine.error.code ?? ""}`);
  const g = growth.data as RawGrowth | null; // 숫자만 담긴 요약 — 실패하면 카드만 숨긴다
  return {
    ...quota,
    growth: g
      ? {
          total: g.total,
          added7d: g.added_7d,
          fromQuestions: g.from_questions,
          daily: g.daily ?? [],
          lastRun: g.last_run ? { runOn: g.last_run.run_on, questions: g.last_run.questions, drafted: g.last_run.drafted } : null,
          recent: g.recent ?? [],
        }
      : null,
    myCount: mine.count ?? 0,
    mine: (mine.data ?? []).map((q) => ({ id: q.id, askedOn: q.asked_on, question: q.question })),
  };
}
