import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { askQuota } from "@/lib/ask/quota";
import { loadLibrary } from "@/lib/mcp/library";
import { seoulToday } from "@/lib/seoul-date";

// 질문하기 탭(D-115 · D-119) — 오늘 남은 횟수 · 지도가 자라는 숫자(map_growth, 숫자와 공용 기술 이름만) · 내 최근 질문.
export type Growth = {
  total: number;
  added7d: number;
  fromQuestions: number;
  daily: number[]; // 최근 14일 날마다 들어간 공용 기술 수 — 오래된 날부터, 마지막이 오늘
  lastRun: { runOn: string; questions: number; drafted: number } | null;
  recent: { slug: string; name: string; position: string | null }[];
};
export type AskHome = {
  today: string; // 서울 날짜 — 캐시 안에서 정한다. 화면에서 시각을 읽으면 그 화면이 미리 받기에서 빠진다(D-106 · D-119)
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

export async function getAskHome(): Promise<AskHome> {
  "use cache: private"; // 내 데이터 — 휴대폰 안에서만 재사용. stale 5분 이상이어야 미리 받기에 포함된다(D-45)
  cacheLife({ stale: 300 });
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
  if (mine.error) throw new Error(`ask home: ${mine.error.code ?? ""}`);
  const g = growth.data as RawGrowth | null; // 숫자만 담긴 요약 — 실패하면 카드만 숨긴다
  return {
    today: seoulToday(),
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

export type QuestionView = {
  id: string;
  askedOn: string;
  question: string;
  answer: string;
  techniques: { slug: string; nameKo: string; position: string; positionName: string }[];
};

// 질문 다시 보기 — 본인 것만(RLS). 없으면 null. 답에 나온 기술도 여기서 푼다 — loadLibrary 가 시각을 읽어, 캐시 밖이면 미리 받기에서 빠진다(D-119).
export async function getQuestion(id: string): Promise<QuestionView | null> {
  "use cache: private";
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("questions")
    .select("id, asked_on, question, answer, slugs")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`question: ${error.code ?? ""}`);
  if (!data) return null;
  const lib = await loadLibrary();
  return {
    id: data.id,
    askedOn: data.asked_on,
    question: data.question,
    answer: data.answer,
    techniques: data.slugs.flatMap((s) => lib.bySlug.get(s) ?? []).map((t) => ({
      slug: t.slug,
      nameKo: t.nameKo,
      position: t.position,
      positionName: lib.posBySlug.get(t.position)?.nameKo ?? t.position,
    })),
  };
}
