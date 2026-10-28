import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addDays, seoulToday } from "@/lib/seoul-date";
import { BELT_WEEKS, isBelt, isStartMonth, type Belt } from "@/lib/belt";
import { LOG_ROW_SELECT, toLogRow, type LogRow } from "@/lib/logs-data";

// 홈(T-21)에 필요한 것만 읽는다. RLS 로 본인 것만 나온다(DB.md 5).
export type HomeData = {
  recent: LogRow[];
  map: { slug: string; nameKo: string; learned: number }[]; // 내 주짓수 지도(D-60) — 포지션 순서대로, 숙련도가 있는 기술 수
  belt: Belt; // 내 벨트 색(auth user_metadata, D-33)
  startedOn: string | null; // 수련 시작 'YYYY-MM'(D-59)
  thisMonth: string; // 서울 기준 이번 달 'YYYY-MM' — "수련 N년째" 계산용
  weeks: { start: string; count: number }[]; // 최근 104주(월요일 시작, 서울) — 오래된 주부터
};

export async function getHomeData(): Promise<HomeData> {
  "use cache: private"; // 내 데이터 — 서버에 남기지 않고 휴대폰 안에서만 재사용. stale 5분 이상이어야 미리 받기(prefetch)에 포함된다(D-45)
  cacheLife({ stale: 300 }); // 5분 — 이보다 짧으면 탭을 눌러야 그때 불러와서 로딩이 보인다
  const supabase = await createSupabaseServer();

  const today = seoulToday();

  // 이번 주 월요일(서울)부터 거꾸로 104주
  const [y, m, d] = today.split("-").map(Number);
  const monday = addDays(today, -((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7));
  const firstWeek = addDays(monday, -7 * (BELT_WEEKS - 1));

  const [logs, days, me, positions, levels] = await Promise.all([
    supabase
      .from("class_logs")
      .select(LOG_ROW_SELECT)
      .order("logged_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("class_logs").select("logged_on").gte("logged_on", firstWeek).limit(5000),
    supabase.auth.getUser(),
    supabase.from("positions").select("slug, name_ko").order("sort_order"),
    supabase.from("technique_levels").select("techniques(positions(slug))").limit(5000),
  ]);
  const error = logs.error ?? days.error ?? positions.error ?? levels.error;
  if (error) throw new Error(`home: ${error.code ?? ""} ${error.message.slice(0, 80)}`);

  const weeks = Array.from({ length: BELT_WEEKS }, (_, i) => ({ start: addDays(firstWeek, i * 7), count: 0 }));
  const firstMs = Date.parse(firstWeek);
  for (const row of days.data ?? []) {
    const i = Math.floor((Date.parse(row.logged_on) - firstMs) / (7 * 86_400_000));
    if (i >= 0 && i < BELT_WEEKS) weeks[i].count += 1;
  }
  const learnedBy = new Map<string, number>();
  for (const l of levels.data ?? []) {
    const slug = l.techniques?.positions?.slug;
    if (slug) learnedBy.set(slug, (learnedBy.get(slug) ?? 0) + 1);
  }
  const belt = me.data.user?.user_metadata?.belt;
  const startedOn = me.data.user?.user_metadata?.started_on;

  return {
    belt: isBelt(belt) ? belt : "white",
    startedOn: isStartMonth(startedOn) ? startedOn : null,
    thisMonth: today.slice(0, 7),
    weeks,
    recent: (logs.data ?? []).map(toLogRow),
    map: (positions.data ?? []).map((p) => ({ slug: p.slug, nameKo: p.name_ko, learned: learnedBy.get(p.slug) ?? 0 })),
  };
}
