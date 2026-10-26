import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addDays, seoulToday } from "@/lib/seoul-date";
import { BELT_WEEKS, isBelt, type Belt } from "@/lib/belt";

// 홈(T-21)에 필요한 것만 읽는다. RLS 로 본인 것만 나온다(DB.md 5).
export type RecentLog = { id: string; loggedOn: string; names: string[]; excerpt: string };
export type HomeData = {
  dueToday: number; // 오늘(서울) 이하 복습일 카드 수
  totalCards: number;
  nextDue: string | null; // 오늘 복습이 없을 때 다음 복습일
  recent: RecentLog[];
  belt: Belt; // 내 벨트 색(auth user_metadata, D-33)
  weeks: { start: string; count: number }[]; // 최근 104주(월요일 시작, 서울) — 오래된 주부터
};

// supabase 는 호출하는 쪽이 만든다(쿠키 읽기를 try 밖에 두기 위해 — home-sections 참고)
export async function getHomeData(): Promise<HomeData> {
  "use cache: private"; // 내 데이터 — 서버에 남기지 않고, 휴대폰 안에서만 30초 재사용 → 미리 불러오기(prefetch)에 들어감
  cacheLife({ stale: 30 });
  const supabase = await createSupabaseServer();

  const today = seoulToday();

  // 이번 주 월요일(서울)부터 거꾸로 104주
  const [y, m, d] = today.split("-").map(Number);
  const monday = addDays(today, -((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7));
  const firstWeek = addDays(monday, -7 * (BELT_WEEKS - 1));

  const [due, total, next, logs, days, me] = await Promise.all([
    supabase.from("review_cards").select("id", { count: "exact", head: true }).lte("due_on", today),
    supabase.from("review_cards").select("id", { count: "exact", head: true }),
    supabase.from("review_cards").select("due_on").gt("due_on", today).order("due_on").limit(1),
    supabase
      .from("class_logs")
      .select("id, logged_on, body, class_log_techniques(custom_name, techniques(name_ko))")
      .order("logged_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("class_logs").select("logged_on").gte("logged_on", firstWeek).limit(5000),
    supabase.auth.getUser(),
  ]);
  const error = due.error ?? total.error ?? next.error ?? logs.error ?? days.error;
  if (error) throw new Error(`home: ${error.code ?? ""} ${error.message.slice(0, 80)}`);

  const weeks = Array.from({ length: BELT_WEEKS }, (_, i) => ({ start: addDays(firstWeek, i * 7), count: 0 }));
  const firstMs = Date.parse(firstWeek);
  for (const row of days.data ?? []) {
    const i = Math.floor((Date.parse(row.logged_on) - firstMs) / (7 * 86_400_000));
    if (i >= 0 && i < BELT_WEEKS) weeks[i].count += 1;
  }
  const belt = me.data.user?.user_metadata?.belt;

  return {
    belt: isBelt(belt) ? belt : "white",
    weeks,
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
