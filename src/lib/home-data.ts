import "server-only";
import { createSupabaseServer } from "@/lib/supabase/server";
import { seoulToday } from "@/lib/seoul-date";

// 홈(T-21)에 필요한 것만 읽는다. RLS 로 본인 것만 나온다(DB.md 5).
export type RecentLog = { id: string; loggedOn: string; names: string[]; excerpt: string };
export type HomeData = {
  dueToday: number; // 오늘(서울) 이하 복습일 카드 수
  totalCards: number;
  nextDue: string | null; // 오늘 복습이 없을 때 다음 복습일
  recent: RecentLog[];
};

export async function getHomeData(): Promise<HomeData> {
  const supabase = await createSupabaseServer();
  const today = seoulToday();

  const [due, total, next, logs] = await Promise.all([
    supabase.from("review_cards").select("id", { count: "exact", head: true }).lte("due_on", today),
    supabase.from("review_cards").select("id", { count: "exact", head: true }),
    supabase.from("review_cards").select("due_on").gt("due_on", today).order("due_on").limit(1),
    supabase
      .from("class_logs")
      .select("id, logged_on, body, class_log_techniques(custom_name, techniques(name_ko))")
      .order("logged_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  const error = due.error ?? total.error ?? next.error ?? logs.error;
  if (error) throw new Error(`home: ${error.code ?? ""} ${error.message.slice(0, 80)}`);

  return {
    dueToday: due.count ?? 0,
    totalCards: total.count ?? 0,
    nextDue: next.data?.[0]?.due_on ?? null,
    recent: (logs.data ?? []).map((l) => ({
      id: l.id,
      loggedOn: l.logged_on,
      names: l.class_log_techniques
        .map((c) => c.techniques?.name_ko ?? c.custom_name)
        .filter((n): n is string => Boolean(n)),
      excerpt: l.body.slice(0, 40),
    })),
  };
}
