import "server-only";
import { cookies } from "next/headers";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addDays, seoulToday } from "@/lib/seoul-date";
import type { Level } from "@/lib/mock/log-seed";
import { GYM_COOKIE, WEEKDAY_KO, hhmm } from "@/lib/gym-shared";
export { GYM_COOKIE, WEEKDAY_KO, hhmm };

// 관장님 버전 (D-127, FLOW 8 · DB 11) — 체육관 · 역할 · 스케줄 · 수업. 기록은 사람 것이라 여기서 안 읽는다(관원 기록은 함수로만).
export type GymRole = "owner" | "coach" | "member";
export type MyGym = { id: string; name: string; network: string | null; role: GymRole };

type Client = Awaited<ReturnType<typeof createSupabaseServer>>;

// 내 줄만 — 같은 체육관 사람의 줄도 읽히는 표라(접근 규칙 "같은 체육관 보기") 꼭 내 id 로 거른다(2026-11-09 발견: 안 거르면 관원이 관장 줄을 받아 관장 화면이 보였음)
export async function queryMyGyms(supabase: Client, userId: string): Promise<MyGym[]> {
  const { data, error } = await supabase
    .from("gym_members")
    .select("role, gyms(id, name, network)")
    .eq("user_id", userId)
    .order("joined_at");
  if (error) throw new Error(`gyms: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  return (data ?? []).flatMap((m) => (m.gyms ? [{ id: m.gyms.id, name: m.gyms.name, network: m.gyms.network ?? null, role: m.role as GymRole }] : []));
}

// 관장 화면이 지금 보는 체육관 — 쿠키에 적힌 것, 없으면 내가 관장 · 코치인 첫 체육관. 관장 · 코치가 아니면 null
export async function currentStaffGym(supabase: Client): Promise<{ gym: MyGym; all: MyGym[] } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const all = (await queryMyGyms(supabase, user.id)).filter((g) => g.role !== "member");
  if (all.length === 0) return null;
  const picked = (await cookies()).get(GYM_COOKIE)?.value;
  return { gym: all.find((g) => g.id === picked) ?? all[0], all };
}

export type Schedule = {
  id: string;
  name: string;
  weekday: number; // 0 일 ~ 6 토
  startsAt: string; // 'HH:MM'
  minutes: number;
  coachId: string | null;
};
export type ClassRow = {
  id: string;
  scheduleId: string | null;
  heldOn: string;
  name: string;
  startsAt: string;
  status: "posted" | "canceled";
  body: string;
  techniques: { slug: string | null; nameKo: string }[];
  attendance: number;
};
// 한 날짜의 수업 칸 — 규칙에서 계산한 것에 등록된 수업(gym_classes)을 겹친다(FLOW 8-3)
export type DaySlot = {
  key: string; // scheduleId 또는 class id
  heldOn: string;
  name: string;
  startsAt: string;
  scheduleId: string | null;
  cls: ClassRow | null; // 내용이 등록됐거나 휴강이면 있음
};


function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
// 이번 주 월요일(서울)
export function mondayOf(iso: string): string {
  return addDays(iso, -((weekdayOf(iso) + 6) % 7));
}

export async function querySchedules(supabase: Client, gymId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("gym_schedules")
    .select("id, name, weekday, starts_at, minutes, coach_id")
    .eq("gym_id", gymId)
    .is("active_until", null)
    .order("weekday")
    .order("starts_at");
  if (error) throw new Error(`schedules: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    weekday: s.weekday,
    startsAt: hhmm(s.starts_at),
    minutes: s.minutes,
    coachId: s.coach_id,
  }));
}

export async function queryClasses(supabase: Client, gymId: string, from: string, to: string): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from("gym_classes")
    .select(
      "id, schedule_id, held_on, name, starts_at, status, body, gym_class_techniques(sort_order, custom_name, techniques(slug, name_ko)), gym_attendance(id)",
    )
    .eq("gym_id", gymId)
    .gte("held_on", from)
    .lte("held_on", to)
    .order("held_on")
    .order("starts_at");
  if (error) throw new Error(`classes: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  return (data ?? []).map((c) => ({
    id: c.id,
    scheduleId: c.schedule_id,
    heldOn: c.held_on,
    name: c.name,
    startsAt: hhmm(c.starts_at),
    status: c.status as ClassRow["status"],
    body: c.body,
    techniques: [...c.gym_class_techniques]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({ slug: t.techniques?.slug ?? null, nameKo: t.techniques?.name_ko ?? t.custom_name ?? "" })),
    attendance: c.gym_attendance.length,
  }));
}

// 날짜 하나의 수업 칸들 — 규칙 + 등록된 수업
export function slotsOn(day: string, schedules: Schedule[], classes: ClassRow[]): DaySlot[] {
  const wd = weekdayOf(day);
  const onDay = classes.filter((c) => c.heldOn === day);
  const slots: DaySlot[] = schedules
    .filter((s) => s.weekday === wd)
    .map((s) => ({
      key: s.id,
      heldOn: day,
      name: s.name,
      startsAt: s.startsAt,
      scheduleId: s.id,
      cls: onDay.find((c) => c.scheduleId === s.id) ?? null,
    }));
  // 규칙 없이 그 날짜만 만든 수업
  for (const c of onDay) if (!c.scheduleId) slots.push({ key: c.id, heldOn: day, name: c.name, startsAt: c.startsAt, scheduleId: null, cls: c });
  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export type GymHome = {
  gym: MyGym;
  all: MyGym[];
  today: string;
  week: { day: string; slots: DaySlot[] }[]; // 월~일
  members: number;
  weekAttendance: number;
  codes: { join: string; coach: string } | null; // 관장만
  coachNames: Record<string, string>; // 담당 코치 표시용
};

export async function getGymHome(): Promise<GymHome | null> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45). 미리 만들기 단계에서 조회가 끊기지 않게(2026-11-09 확인)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const cur = await currentStaffGym(supabase);
  if (!cur) return null;
  const today = seoulToday();
  const monday = mondayOf(today);
  const sunday = addDays(monday, 6);
  const [schedules, classes, members, codes, names] = await Promise.all([
    querySchedules(supabase, cur.gym.id),
    queryClasses(supabase, cur.gym.id, monday, sunday),
    supabase.from("gym_members").select("id", { count: "exact", head: true }).eq("gym_id", cur.gym.id),
    cur.gym.role === "owner" ? supabase.rpc("gym_codes", { p_gym: cur.gym.id }) : Promise.resolve({ data: null }),
    supabase.rpc("gym_member_names", { p_gym: cur.gym.id }),
  ]);
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    return { day, slots: slotsOn(day, schedules, classes) };
  });
  const c = codes.data as { join_code?: string; coach_code?: string } | null;
  const coachNames: Record<string, string> = {};
  for (const n of names.data ?? []) if (n.role !== "member") coachNames[n.user_id] = n.nick;
  return {
    gym: cur.gym,
    all: cur.all,
    today,
    week,
    members: members.count ?? 0,
    weekAttendance: classes.reduce((n, x) => n + x.attendance, 0),
    codes: c?.join_code && c.coach_code ? { join: c.join_code, coach: c.coach_code } : null,
    coachNames,
  };
}

export type GymSchedulePage = { gym: MyGym; schedules: Schedule[]; coaches: { id: string; nick: string }[] };
export async function getGymSchedule(): Promise<GymSchedulePage | null> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45). 미리 만들기 단계에서 조회가 끊기지 않게(2026-11-09 확인)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const cur = await currentStaffGym(supabase);
  if (!cur) return null;
  const [schedules, names] = await Promise.all([querySchedules(supabase, cur.gym.id), supabase.rpc("gym_member_names", { p_gym: cur.gym.id })]);
  return {
    gym: cur.gym,
    schedules,
    coaches: (names.data ?? []).filter((n) => n.role !== "member").map((n) => ({ id: n.user_id, nick: n.nick })),
  };
}

// ---------- 수업 내용 등록 · 보기 ----------
export type ClassDetail = {
  gym: MyGym;
  cls: ClassRow;
  today: string;
  attendees: { userId: string; nick: string; belt: string | null; at: string }[];
};
export async function getClassDetail(id: string): Promise<ClassDetail | null> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45). 미리 만들기 단계에서 조회가 끊기지 않게(2026-11-09 확인)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const { data: c, error } = await supabase
    .from("gym_classes")
    .select(
      "id, gym_id, schedule_id, held_on, name, starts_at, status, body, gym_class_techniques(sort_order, custom_name, techniques(slug, name_ko)), gym_attendance(user_id, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`class: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  if (!c) return null;
  const cur = await currentStaffGym(supabase);
  const gym = cur?.all.find((g) => g.id === c.gym_id);
  if (!gym) return null;
  const names = await supabase.rpc("gym_member_names", { p_gym: c.gym_id });
  const nick = new Map((names.data ?? []).map((n) => [n.user_id, n]));
  return {
    gym,
    today: seoulToday(),
    cls: {
      id: c.id,
      scheduleId: c.schedule_id,
      heldOn: c.held_on,
      name: c.name,
      startsAt: hhmm(c.starts_at),
      status: c.status as ClassRow["status"],
      body: c.body,
      techniques: [...c.gym_class_techniques]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((t) => ({ slug: t.techniques?.slug ?? null, nameKo: t.techniques?.name_ko ?? t.custom_name ?? "" })),
      attendance: c.gym_attendance.length,
    },
    attendees: [...c.gym_attendance]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((a) => ({ userId: a.user_id, nick: nick.get(a.user_id)?.nick ?? "관원", belt: nick.get(a.user_id)?.belt ?? null, at: a.created_at })),
  };
}

// 새 수업 등록 화면이 쓸 정보 — 규칙(이름 · 시각)과 날짜
export type NewClassInfo = { gym: MyGym; heldOn: string; scheduleId: string | null; name: string; startsAt: string; today: string };
export async function getNewClassInfo(heldOn: string, scheduleId: string | null): Promise<NewClassInfo | null> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45). 미리 만들기 단계에서 조회가 끊기지 않게(2026-11-09 확인)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const cur = await currentStaffGym(supabase);
  if (!cur) return null;
  let name = "기본반";
  let startsAt = "20:00";
  if (scheduleId) {
    const { data } = await supabase.from("gym_schedules").select("name, starts_at").eq("id", scheduleId).eq("gym_id", cur.gym.id).maybeSingle();
    if (!data) return null;
    name = data.name;
    startsAt = hhmm(data.starts_at);
  }
  return { gym: cur.gym, heldOn, scheduleId, name, startsAt, today: seoulToday() };
}

// ---------- 관원 홈 카드 (FLOW 8-3 관원 쪽) ----------
export type MemberGymCard = {
  id: string;
  name: string;
  network: string | null;
  role: GymRole;
  today: { key: string; name: string; startsAt: string; classId: string | null; status: "waiting" | "posted" | "canceled"; techniques: string[]; myLogId: string | null }[];
};
export async function queryMemberGymCards(supabase: Client, userId: string): Promise<MemberGymCard[]> {
  const gyms = await queryMyGyms(supabase, userId);
  if (!gyms.length) return [];
  const today = seoulToday();
  const cards = await Promise.all(
    gyms.map(async (g) => {
      const [schedules, classes, att] = await Promise.all([
        querySchedules(supabase, g.id),
        queryClasses(supabase, g.id, today, today),
        supabase.from("gym_attendance").select("gym_class_id, class_log_id").eq("user_id", userId),
      ]);
      const mine = new Map((att.data ?? []).map((a) => [a.gym_class_id, a.class_log_id]));
      return {
        id: g.id,
        name: g.name,
        network: g.network,
        role: g.role,
        today: slotsOn(today, schedules, classes).map((s) => ({
          key: s.key,
          name: s.name,
          startsAt: s.startsAt,
          classId: s.cls?.id ?? null,
          status: (s.cls ? s.cls.status : "waiting") as "waiting" | "posted" | "canceled",
          techniques: s.cls?.techniques.map((t) => t.nameKo) ?? [],
          myLogId: s.cls ? (mine.get(s.cls.id) ?? null) : null,
        })),
      };
    }),
  );
  return cards;
}

// ---------- 관원 목록 · 관원 한 명 · 관원 기록 (FLOW 8-3) ----------
export type MemberRow = { userId: string; nick: string; belt: string | null; role: GymRole; joinedAt: string; lastAttended: string | null; monthAttendance: number };
export type MembersPage = { gym: MyGym; all: MyGym[]; members: MemberRow[]; today: string };
export async function getMembers(): Promise<MembersPage | null> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45). 미리 만들기 단계에서 조회가 끊기지 않게(2026-11-09 확인)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const cur = await currentStaffGym(supabase);
  if (!cur) return null;
  const today = seoulToday();
  const monthStart = today.slice(0, 7) + "-01";
  const [names, att] = await Promise.all([
    supabase.rpc("gym_member_names", { p_gym: cur.gym.id }),
    supabase.from("gym_attendance").select("user_id, gym_classes!inner(gym_id, held_on)").eq("gym_classes.gym_id", cur.gym.id),
  ]);
  if (names.error) throw new Error(`members: ${names.error.code ?? ""} ${names.error.message.slice(0, 80)}`);
  const last = new Map<string, string>();
  const month = new Map<string, number>();
  for (const a of att.data ?? []) {
    const d = a.gym_classes?.held_on;
    if (!d) continue;
    if (!last.has(a.user_id) || last.get(a.user_id)! < d) last.set(a.user_id, d);
    if (d >= monthStart) month.set(a.user_id, (month.get(a.user_id) ?? 0) + 1);
  }
  const members = (names.data ?? [])
    .map((n) => ({
      userId: n.user_id,
      nick: n.nick,
      belt: n.belt,
      role: n.role as GymRole,
      joinedAt: n.joined_at,
      lastAttended: last.get(n.user_id) ?? null,
      monthAttendance: month.get(n.user_id) ?? 0,
    }))
    .sort((a, b) => (b.lastAttended ?? "").localeCompare(a.lastAttended ?? "") || a.nick.localeCompare(b.nick));
  return { gym: cur.gym, all: cur.all, members, today };
}

export type MemberLogRow = { id: string; loggedOn: string; body: string; sparring: number; fromClass: boolean; techniques: string[]; comments: number };
export type MemberDetail = {
  gym: MyGym;
  member: { userId: string; nick: string; belt: string | null; startedOn: string | null; role: GymRole; joinedAt: string };
  month: { attendance: number; logs: number; sparring: number; lastAttended: string | null };
  levels: Map<string, Level>;
  counts: Map<string, number>;
  logs: MemberLogRow[];
  thisMonth: string;
};
export async function getMemberDetail(userId: string): Promise<MemberDetail | null> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45). 미리 만들기 단계에서 조회가 끊기지 않게(2026-11-09 확인)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const cur = await currentStaffGym(supabase);
  if (!cur) return null;
  const [names, ov] = await Promise.all([
    supabase.rpc("gym_member_names", { p_gym: cur.gym.id }),
    supabase.rpc("gym_member_overview", { p_gym: cur.gym.id, p_user: userId }),
  ]);
  if (ov.error) {
    if (ov.error.code === "P0002") return null;
    throw new Error(`member: ${ov.error.code ?? ""} ${ov.error.message.slice(0, 80)}`);
  }
  const me = (names.data ?? []).find((n) => n.user_id === userId);
  if (!me) return null;
  const o = ov.data as {
    levels: { technique_id: string; level: string }[];
    counts: { technique_id: string; n: number }[];
    logs: { id: string; logged_on: string; body: string; sparring_rounds: number; gym_class_id: string | null; techniques: string[]; comments: number }[];
    month: { attendance: number; logs: number; sparring: number; last_attended: string | null };
  };
  return {
    gym: cur.gym,
    member: { userId, nick: me.nick, belt: me.belt, startedOn: me.started_on, role: me.role as GymRole, joinedAt: me.joined_at },
    month: { attendance: o.month.attendance, logs: o.month.logs, sparring: o.month.sparring, lastAttended: o.month.last_attended },
    levels: new Map(o.levels.map((l) => [l.technique_id, l.level as Level])),
    counts: new Map(o.counts.map((c) => [c.technique_id, c.n])),
    logs: o.logs.map((l) => ({ id: l.id, loggedOn: l.logged_on, body: l.body, sparring: l.sparring_rounds, fromClass: !!l.gym_class_id, techniques: l.techniques, comments: l.comments })),
    thisMonth: seoulToday().slice(0, 7),
  };
}

export type MemberLog = {
  gym: MyGym;
  log: {
    id: string;
    userId: string;
    nick: string;
    loggedOn: string;
    body: string;
    sparring: number;
    techniques: { slug: string | null; nameKo: string; nameEn: string | null; position: string | null; positionSlug: string | null; public: boolean }[];
    comments: { id: string; body: string; createdAt: string; author: string; mine: boolean }[];
  };
};
export async function getMemberLog(logId: string): Promise<MemberLog | null> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45). 미리 만들기 단계에서 조회가 끊기지 않게(2026-11-09 확인)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const cur = await currentStaffGym(supabase);
  if (!cur) return null;
  const { data, error } = await supabase.rpc("gym_member_log", { p_gym: cur.gym.id, p_log: logId });
  if (error) throw new Error(`member log: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const l = data as {
    id: string; user_id: string; nick: string; logged_on: string; body: string; sparring_rounds: number;
    techniques: { slug: string | null; name_ko: string; name_en: string | null; position: string | null; position_slug: string | null; public: boolean }[];
    comments: { id: string; body: string; created_at: string; author: string; mine: boolean }[];
  };
  return {
    gym: cur.gym,
    log: {
      id: l.id,
      userId: l.user_id,
      nick: l.nick,
      loggedOn: l.logged_on,
      body: l.body,
      sparring: l.sparring_rounds,
      techniques: l.techniques.map((t) => ({ slug: t.slug, nameKo: t.name_ko, nameEn: t.name_en, position: t.position, positionSlug: t.position_slug, public: t.public })),
      comments: l.comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.created_at, author: c.author, mine: c.mine })),
    },
  };
}

// ---------- 설정 ----------
export type SettingsPage = {
  gym: MyGym;
  all: MyGym[];
  region: string;
  network: string;
  codes: { join: string; coach: string } | null;
  staff: { userId: string; nick: string; role: GymRole }[];
  members: { userId: string; nick: string }[];
};
export async function getGymSettings(): Promise<SettingsPage | null> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45). 미리 만들기 단계에서 조회가 끊기지 않게(2026-11-09 확인)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const cur = await currentStaffGym(supabase);
  if (!cur) return null;
  const [g, codes, names] = await Promise.all([
    supabase.from("gyms").select("region_si, region_gu, network").eq("id", cur.gym.id).maybeSingle(),
    cur.gym.role === "owner" ? supabase.rpc("gym_codes", { p_gym: cur.gym.id }) : Promise.resolve({ data: null }),
    supabase.rpc("gym_member_names", { p_gym: cur.gym.id }),
  ]);
  const c = codes.data as { join_code?: string; coach_code?: string } | null;
  const people = names.data ?? [];
  return {
    gym: cur.gym,
    all: cur.all,
    region: [g.data?.region_si, g.data?.region_gu].filter(Boolean).join(" "),
    network: g.data?.network ?? "",
    codes: c?.join_code && c.coach_code ? { join: c.join_code, coach: c.coach_code } : null,
    staff: people.filter((n) => n.role !== "member").map((n) => ({ userId: n.user_id, nick: n.nick, role: n.role as GymRole })),
    members: people.filter((n) => n.role === "member").map((n) => ({ userId: n.user_id, nick: n.nick })),
  };
}

// 관원이 내 기록에서 보는 코멘트 (D-127)
export type MyComment = { id: string; body: string; createdAt: string; author: string; role: GymRole; gym: string };
export async function getMyLogComments(logId: string): Promise<MyComment[]> {
  "use cache: private";
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("my_log_comments", { p_log: logId });
  if (error || !Array.isArray(data)) return [];
  return (data as { id: string; body: string; created_at: string; author: string; role: string; gym: string }[]).map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    author: c.author,
    role: c.role as GymRole,
    gym: c.gym,
  }));
}
