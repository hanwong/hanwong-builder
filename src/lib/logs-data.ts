import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";

// 기록 한 줄(날짜 · 기술 이름들 · 글 앞부분) — 홈 최근 기록과 기록 목록(D-40)이 함께 쓴다. RLS 로 본인 것만.
// 질문하기(D-101)도 같은 줄로 섞인다 — kind "question" 이면 excerpt 가 질문 앞부분, 수업 합계에는 안 셈.
export type LogRow = {
  id: string;
  kind: "log" | "question";
  loggedOn: string;
  at: string; // 같은 날 안에서 순서(쓴 시각)
  names: string[];
  excerpt: string;
  sparring: number;
};

export const LOG_ROW_SELECT =
  "id, logged_on, created_at, body, sparring_rounds, class_log_techniques(custom_name, techniques(name_ko))";
const QUESTION_ROW_SELECT = "id, asked_on, created_at, question";

export function toLogRow(l: {
  id: string;
  logged_on: string;
  created_at: string;
  body: string;
  sparring_rounds: number;
  class_log_techniques: { custom_name: string | null; techniques: { name_ko: string } | null }[];
}): LogRow {
  return {
    id: l.id,
    kind: "log",
    loggedOn: l.logged_on,
    at: l.created_at,
    names: l.class_log_techniques
      .map((c) => c.techniques?.name_ko ?? c.custom_name)
      .filter((n): n is string => Boolean(n)),
    excerpt: l.body.slice(0, 40),
    sparring: l.sparring_rounds,
  };
}

const toQuestionRow = (q: { id: string; asked_on: string; created_at: string; question: string }): LogRow => ({
  id: q.id,
  kind: "question",
  loggedOn: q.asked_on,
  at: q.created_at,
  names: [],
  excerpt: q.question.slice(0, 60),
  sparring: 0,
});

// 최신순: 날짜 → 쓴 시각
const newestFirst = (a: LogRow, b: LogRow) =>
  a.loggedOn === b.loggedOn ? b.at.localeCompare(a.at) : b.loggedOn.localeCompare(a.loggedOn);

export const LOGS_PAGE = 30; // 30개씩 더 보기

// 기록 목록 (D-40) — 최신순(수업 날짜 → 쓴 시각) 앞에서 limit 개 + 전체 개수.
// 질문(D-101)은 보이는 수업 기록의 가장 오래된 날짜까지만 섞는다(더 보기를 누르면 그 뒤 질문도).
export async function getLogs(limit: number): Promise<{ rows: LogRow[]; total: number }> {
  "use cache: private"; // 내 데이터 — 휴대폰 안에서만 재사용. stale 5분 이상이어야 미리 받기에 포함(D-45)
  cacheLife({ stale: 300 }); // 5분 — 이보다 짧으면 탭을 눌러야 그때 불러와서 로딩이 보인다
  const supabase = await createSupabaseServer();
  const { data, count, error } = await supabase
    .from("class_logs")
    .select(LOG_ROW_SELECT, { count: "exact" })
    .order("logged_on", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);
  if (error) throw new Error(`logs: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  const logs = (data ?? []).map(toLogRow);
  const more = (count ?? 0) > logs.length;
  let q = supabase.from("questions").select(QUESTION_ROW_SELECT);
  if (more && logs.length) q = q.gte("asked_on", logs[logs.length - 1].loggedOn);
  const [{ data: qs, error: qError }, { count: qTotal }] = await Promise.all([
    q.order("asked_on", { ascending: false }).limit(300),
    supabase.from("questions").select("id", { count: "exact", head: true }),
  ]);
  if (qError) throw new Error(`questions: ${qError.code ?? ""} ${qError.message.slice(0, 80)}`);
  const rows = [...logs, ...(qs ?? []).map(toQuestionRow)].sort(newestFirst);
  return { rows, total: (count ?? 0) + (qTotal ?? 0) };
}

// 기록 달력 (D-98) — 한 달(YYYY-MM)치 기록. 날짜순 정렬은 목록과 같게.
export async function getLogsInMonth(month: string): Promise<LogRow[]> {
  "use cache: private";
  cacheLife({ stale: 300 });
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("class_logs")
    .select(LOG_ROW_SELECT)
    .gte("logged_on", `${month}-01`)
    .lt("logged_on", next)
    .order("logged_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(`logs month: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  const { data: qs, error: qError } = await supabase
    .from("questions")
    .select(QUESTION_ROW_SELECT)
    .gte("asked_on", `${month}-01`)
    .lt("asked_on", next)
    .limit(300);
  if (qError) throw new Error(`questions month: ${qError.code ?? ""} ${qError.message.slice(0, 80)}`);
  return [...(data ?? []).map(toLogRow), ...(qs ?? []).map(toQuestionRow)].sort(newestFirst);
}
