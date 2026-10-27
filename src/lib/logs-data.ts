import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";

// 기록 한 줄(날짜 · 기술 이름들 · 글 앞부분) — 홈 최근 기록과 기록 목록(D-40)이 함께 쓴다. RLS 로 본인 것만.
export type LogRow = { id: string; loggedOn: string; names: string[]; excerpt: string };

export const LOG_ROW_SELECT = "id, logged_on, body, class_log_techniques(custom_name, techniques(name_ko))";

export function toLogRow(l: {
  id: string;
  logged_on: string;
  body: string;
  class_log_techniques: { custom_name: string | null; techniques: { name_ko: string } | null }[];
}): LogRow {
  return {
    id: l.id,
    loggedOn: l.logged_on,
    names: l.class_log_techniques
      .map((c) => c.techniques?.name_ko ?? c.custom_name)
      .filter((n): n is string => Boolean(n)),
    excerpt: l.body.slice(0, 40),
  };
}

export const LOGS_PAGE = 30; // 30개씩 더 보기

// 기록 목록 (D-40) — 최신순(수업 날짜 → 쓴 시각) 앞에서 limit 개 + 전체 개수
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
  return { rows: (data ?? []).map(toLogRow), total: count ?? 0 };
}
