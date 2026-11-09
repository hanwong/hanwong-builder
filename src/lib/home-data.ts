import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addDays, seoulToday } from "@/lib/seoul-date";
import { BELT_WEEKS, cleanStripes, isBelt, isStartMonth, type Belt } from "@/lib/belt";
import { cleanNick, emailId } from "@/lib/nickname";
import { queryBeltProgress, type BeltProgress } from "@/lib/belt-techniques-data";
import { queryMemberGymCards, type MemberGymCard } from "@/lib/gym-data";

// 홈(T-21)에 필요한 것만 읽는다. RLS 로 본인 것만 나온다(DB.md 5).
export type HomeData = {
  map: { slug: string; nameKo: string; learned: number }[]; // 내 주짓수 지도(D-60) — 포지션 순서대로, 숙련도가 있는 기술 수
  belt: Belt; // 내 벨트 색(auth user_metadata, D-33)
  stripes: number; // 그랄 0~4 · 블랙 0~10(D-131)
  startedOn: string | null; // 수련 시작 'YYYY-MM'(D-59)
  nick: string; // 닉네임(D-122) — 안 적었으면 빈 글자
  defaultNick: string; // 닉네임을 안 적었을 때 쓰는 이메일 앞부분(D-122)
  thisMonth: string; // 서울 기준 이번 달 'YYYY-MM' — "수련 N년째" 계산용
  sparring: { month: number; total: number }; // 스파링 판 수(D-64) — 이번 달 · 전체
  weeks: { start: string; count: number }[]; // 최근 104주(월요일 시작, 서울) — 오래된 주부터
  beltProgress: BeltProgress; // 내 벨트 필수 기술 카드(D-140) — 지도 위
  gyms: MemberGymCard[]; // 내 체육관(D-127) — 오늘 수업 · 출석
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

  const [days, me, positions, levels] = await Promise.all([
    // 벨트(최근 2년)와 스파링(전체)을 한 번에 — 기록은 사람당 많아야 수천 개
    supabase.from("class_logs").select("logged_on, sparring_rounds").limit(10000),
    supabase.auth.getUser(),
    supabase.from("positions").select("slug, name_ko").order("sort_order"),
    supabase.from("technique_levels").select("techniques(positions(slug))").limit(5000),
  ]);
  const error = days.error ?? positions.error ?? levels.error;
  if (error) throw new Error(`home: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  const [gyms, beltProgress] = await Promise.all([
    me.data.user ? queryMemberGymCards(supabase, me.data.user.id) : Promise.resolve([]),
    queryBeltProgress(supabase, me.data.user?.user_metadata?.belt),
  ]);

  const weeks = Array.from({ length: BELT_WEEKS }, (_, i) => ({ start: addDays(firstWeek, i * 7), count: 0 }));
  const firstMs = Date.parse(firstWeek);
  const sparring = { month: 0, total: 0 };
  for (const row of days.data ?? []) {
    sparring.total += row.sparring_rounds;
    if (row.logged_on.startsWith(today.slice(0, 7))) sparring.month += row.sparring_rounds;
  }
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

  const myBelt = isBelt(belt) ? belt : "white";

  return {
    belt: myBelt,
    stripes: cleanStripes(me.data.user?.user_metadata?.stripes, myBelt),
    beltProgress,
    gyms,
    startedOn: isStartMonth(startedOn) ? startedOn : null,
    nick: cleanNick(me.data.user?.user_metadata?.nick) ?? "",
    defaultNick: emailId(me.data.user?.email),
    thisMonth: today.slice(0, 7),
    sparring,
    weeks,
    map: (positions.data ?? []).map((p) => ({ slug: p.slug, nameKo: p.name_ko, learned: learnedBy.get(p.slug) ?? 0 })),
  };
}
