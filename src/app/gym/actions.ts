"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { GYM_COOKIE, isGymNetwork } from "@/lib/gym-shared";
import { isIsoDate, seoulToday, addDays } from "@/lib/seoul-date";

// 관장님 버전 서버 동작 (D-127). 체육관 · 가입 · 스케줄 · 수업 · 출석 · 코멘트. 비밀값 없음 — 접근 규칙은 DB(RLS · 함수)가 지킨다.
type Res<T = object> = ({ ok: true } & T) | { ok: false; message: string };
const UUID = /^[0-9a-f-]{36}$/i;
const CODE = /^[A-HJ-NP-Z2-9]{6}$/;
const fail = (message: string): { ok: false; message: string } => ({ ok: false, message });

export async function createGym(input: { name: string; si: string; gu: string; network: string }): Promise<Res<{ id: string }>> {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 30) return fail("체육관 이름은 1~30자로 적어 주세요.");
  if (input.network && !isGymNetwork(input.network)) return fail("목록에 있는 네트워크만 고를 수 있어요. 없으면 '없음'으로 두고 관리자에게 알려 주세요.");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("create_gym", {
    p_name: name,
    p_si: input.si.trim().slice(0, 20),
    p_gu: input.gu.trim().slice(0, 20),
    p_network: input.network || undefined,
  });
  if (error || !data) {
    console.error("createGym failed:", error?.code);
    return fail(error?.code === "P0003" ? "체육관은 5개까지 등록할 수 있어요." : "등록하지 못했어요. 다시 눌러 주세요.");
  }
  (await cookies()).set(GYM_COOKIE, data, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true, id: data };
}

export async function pickGym(id: string): Promise<void> {
  if (!UUID.test(id)) return;
  (await cookies()).set(GYM_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/gym", "layout");
}

export type PeekedGym = { id: string; name: string; network: string | null; region: string | null; role: "member" | "coach"; already: string | null };
export async function peekGym(code: string): Promise<Res<{ gym: PeekedGym | null }>> {
  const c = code.trim().toUpperCase();
  if (!CODE.test(c)) return fail("코드는 영문 대문자 · 숫자 6자리예요.");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("peek_gym", { p_code: c });
  if (error) return fail("확인하지 못했어요. 다시 눌러 주세요.");
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: true, gym: null };
  const g = data as { id: string; name: string; network: string | null; region_si: string | null; region_gu: string | null; role: "member" | "coach"; already: string | null };
  return { ok: true, gym: { id: g.id, name: g.name, network: g.network ?? null, region: [g.region_si, g.region_gu].filter(Boolean).join(" ") || null, role: g.role, already: g.already } };
}

export async function joinGym(code: string, realName: string): Promise<Res<{ id: string }>> {
  const c = code.trim().toUpperCase();
  if (!CODE.test(c)) return fail("코드는 영문 대문자 · 숫자 6자리예요.");
  const name = realName.trim();
  if (name.length < 1 || name.length > 20) return fail("본명을 적어 주세요(20자까지).");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("join_gym", { p_code: c, p_real_name: name });
  if (error || !data) return fail(error?.code === "P0002" ? "없는 코드예요. 다시 확인해 주세요." : "들어가지 못했어요. 다시 눌러 주세요.");
  revalidatePath("/app", "layout");
  revalidatePath("/gym", "layout");
  return { ok: true, id: data };
}

// 이미 들어와 있는 사람이 본명을 적거나 고친다(D-130) — 관장 · 코치에게만 보인다.
export async function setGymRealName(gymId: string, realName: string): Promise<Res> {
  if (!UUID.test(gymId)) return fail("없는 체육관이에요.");
  const name = realName.trim();
  if (name.length < 1 || name.length > 20) return fail("본명을 적어 주세요(20자까지).");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("set_gym_real_name", { p_gym: gymId, p_real_name: name });
  if (error) return fail("저장하지 못했어요. 다시 눌러 주세요.");
  revalidatePath("/app", "layout");
  revalidatePath("/gym", "layout");
  return { ok: true };
}

export async function leaveGym(gymId: string): Promise<Res> {
  if (!UUID.test(gymId)) return fail("없는 체육관이에요.");
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("로그인이 풀렸어요.");
  const { error, count } = await supabase.from("gym_members").delete({ count: "exact" }).eq("gym_id", gymId).eq("user_id", user.id).neq("role", "owner");
  if (error) return fail("나가지 못했어요. 다시 눌러 주세요.");
  if (!count) return fail("관장은 나갈 수 없어요. 먼저 관장을 넘겨 주세요.");
  revalidatePath("/app", "layout");
  revalidatePath("/gym", "layout");
  return { ok: true };
}

// ---------- 스케줄 ----------
export type ScheduleInput = { name: string; weekdays: number[]; startsAt: string; minutes: number; coachId: string | null };
function cleanSchedule(i: ScheduleInput): ScheduleInput | null {
  const name = i.name.trim().slice(0, 20);
  const weekdays = [...new Set(i.weekdays)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (!name || !weekdays.length || !/^\d{2}:\d{2}$/.test(i.startsAt)) return null;
  const minutes = [45, 60, 90, 120].includes(i.minutes) ? i.minutes : 60;
  return { name, weekdays, startsAt: i.startsAt, minutes, coachId: i.coachId && UUID.test(i.coachId) ? i.coachId : null };
}

export async function addSchedule(gymId: string, input: ScheduleInput): Promise<Res> {
  if (!UUID.test(gymId)) return fail("없는 체육관이에요.");
  const v = cleanSchedule(input);
  if (!v) return fail("수업 이름 · 요일 · 시작 시각을 확인해 주세요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("gym_schedules").insert(
    v.weekdays.map((weekday) => ({ gym_id: gymId, name: v.name, weekday, starts_at: v.startsAt, minutes: v.minutes, coach_id: v.coachId })),
  );
  if (error) {
    console.error("addSchedule failed:", error.code);
    return fail("저장하지 못했어요. 다시 눌러 주세요.");
  }
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function updateSchedule(id: string, input: { name: string; startsAt: string; minutes: number; coachId: string | null }): Promise<Res> {
  if (!UUID.test(id)) return fail("없는 수업이에요.");
  const v = cleanSchedule({ ...input, weekdays: [0] });
  if (!v) return fail("수업 이름 · 시작 시각을 확인해 주세요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("gym_schedules")
    .update({ name: v.name, starts_at: v.startsAt, minutes: v.minutes, coach_id: v.coachId })
    .eq("id", id);
  if (error) return fail("저장하지 못했어요. 다시 눌러 주세요.");
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

// 없애기 = 오늘부터 안 보이게(지난 수업 내용은 남음)
export async function removeSchedule(id: string): Promise<Res> {
  if (!UUID.test(id)) return fail("없는 수업이에요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("gym_schedules").update({ active_until: addDays(seoulToday(), -1) }).eq("id", id);
  if (error) return fail("없애지 못했어요. 다시 눌러 주세요.");
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

// ---------- 수업(날짜) ----------
// 휴강 — 그 날짜 수업 줄을 canceled 로 만든다(내용이 있으면 못 바꿈)
export async function cancelClass(gymId: string, scheduleId: string, heldOn: string, name: string, startsAt: string, undo = false): Promise<Res> {
  if (!UUID.test(gymId) || !UUID.test(scheduleId) || !isIsoDate(heldOn)) return fail("없는 수업이에요.");
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("로그인이 풀렸어요.");
  if (undo) {
    const { error } = await supabase.from("gym_classes").delete().eq("gym_id", gymId).eq("schedule_id", scheduleId).eq("held_on", heldOn).eq("status", "canceled");
    if (error) return fail("되돌리지 못했어요.");
  } else {
    const { error } = await supabase
      .from("gym_classes")
      .insert({ gym_id: gymId, schedule_id: scheduleId, held_on: heldOn, name: name.slice(0, 20), starts_at: startsAt, status: "canceled", posted_by: user.id });
    if (error) return fail(error.code === "23505" ? "이미 내용이 등록된 수업이에요." : "휴강으로 바꾸지 못했어요.");
  }
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

// ---------- 수업 내용 등록 · 고치기 (FLOW 8-3) ----------
export type ClassInput = {
  scheduleId: string | null;
  heldOn: string;
  name: string;
  startsAt: string; // 'HH:MM'
  body: string;
  slugs: string[]; // 고른 공용 기술
  customNames: string[]; // 목록에 없는 이름
};
function cleanClass(i: ClassInput): ClassInput | null {
  const name = i.name.trim().slice(0, 20);
  if (!name || !isIsoDate(i.heldOn) || !/^\d{2}:\d{2}$/.test(i.startsAt)) return null;
  const slugs = [...new Set(i.slugs.filter((s) => /^[a-z0-9-]{1,100}$/.test(s)))].slice(0, 30);
  const customNames = [...new Set(i.customNames.map((n) => n.trim().slice(0, 60)).filter(Boolean))].slice(0, 10);
  const body = i.body.slice(0, 2000);
  if (!slugs.length && !customNames.length && !body.trim()) return null;
  return { scheduleId: i.scheduleId && UUID.test(i.scheduleId) ? i.scheduleId : null, heldOn: i.heldOn, name, startsAt: i.startsAt, body, slugs, customNames };
}
async function techniqueRows(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, classId: string, v: ClassInput) {
  const { data, error } = v.slugs.length
    ? await supabase.from("techniques").select("id, slug").in("slug", v.slugs).is("owner_id", null)
    : { data: [], error: null };
  if (error) return { rows: null, error };
  const idBySlug = new Map((data ?? []).map((t) => [t.slug, t.id]));
  let order = 0;
  const rows: { gym_class_id: string; technique_id: string | null; custom_name: string | null; sort_order: number }[] = [];
  for (const s of v.slugs) {
    const id = idBySlug.get(s);
    if (id) rows.push({ gym_class_id: classId, technique_id: id, custom_name: null, sort_order: order++ });
  }
  for (const n of v.customNames) rows.push({ gym_class_id: classId, technique_id: null, custom_name: n, sort_order: order++ });
  return { rows, error: null };
}

export async function postClass(gymId: string, input: ClassInput): Promise<Res<{ id: string }>> {
  if (!UUID.test(gymId)) return fail("없는 체육관이에요.");
  const v = cleanClass(input);
  if (!v) return fail("기술이나 메모 중 하나는 넣어 주세요. 메모는 2000자까지예요.");
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("로그인이 풀렸어요.");
  // 휴강으로 만들어 둔 줄이 있으면 그 줄을 쓴다
  if (v.scheduleId) await supabase.from("gym_classes").delete().eq("gym_id", gymId).eq("schedule_id", v.scheduleId).eq("held_on", v.heldOn).eq("status", "canceled");
  const { data: cls, error } = await supabase
    .from("gym_classes")
    .insert({ gym_id: gymId, schedule_id: v.scheduleId, held_on: v.heldOn, name: v.name, starts_at: v.startsAt, body: v.body, posted_by: user.id })
    .select("id")
    .single();
  if (error || !cls) {
    console.error("postClass failed:", error?.code);
    return fail(
      error?.code === "23505" ? "이 수업은 이미 등록됐어요." : error?.code === "42501" ? "지난 수업은 7일 전까지만 등록할 수 있어요." : "등록하지 못했어요. 다시 눌러 주세요.",
    );
  }
  const t = await techniqueRows(supabase, cls.id, v);
  if (t.error || !t.rows) {
    await supabase.from("gym_classes").delete().eq("id", cls.id);
    return fail("기술을 찾지 못했어요. 다시 눌러 주세요.");
  }
  if (t.rows.length) {
    const { error: tErr } = await supabase.from("gym_class_techniques").insert(t.rows);
    if (tErr) {
      await supabase.from("gym_classes").delete().eq("id", cls.id);
      return fail("기술을 저장하지 못했어요. 다시 눌러 주세요.");
    }
  }
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true, id: cls.id };
}

// 고치기 — 이미 가져간 관원 기록은 안 바뀐다(화면에 안내)
export async function updateClass(id: string, input: ClassInput): Promise<Res> {
  if (!UUID.test(id)) return fail("없는 수업이에요.");
  const v = cleanClass(input);
  if (!v) return fail("기술이나 메모 중 하나는 넣어 주세요. 메모는 2000자까지예요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("gym_classes").update({ name: v.name, starts_at: v.startsAt, body: v.body, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail("고치지 못했어요. 다시 눌러 주세요.");
  const t = await techniqueRows(supabase, id, v);
  if (t.error || !t.rows) return fail("기술을 찾지 못했어요. 다시 눌러 주세요.");
  const { error: dErr } = await supabase.from("gym_class_techniques").delete().eq("gym_class_id", id);
  if (dErr) return fail("기술을 고치지 못했어요. 다시 눌러 주세요.");
  if (t.rows.length) {
    const { error: iErr } = await supabase.from("gym_class_techniques").insert(t.rows);
    if (iErr) return fail("기술을 저장하지 못했어요. 다시 눌러 주세요.");
  }
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function deleteClass(id: string): Promise<Res> {
  if (!UUID.test(id)) return fail("없는 수업이에요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("gym_classes").delete().eq("id", id);
  if (error) return fail("지우지 못했어요. 다시 눌러 주세요.");
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

// ---------- 관원: 출석 · 내 기록으로 (FLOW 8-1 ⑤) ----------
export async function attendClass(classId: string): Promise<Res<{ id: string }>> {
  if (!UUID.test(classId)) return fail("없는 수업이에요.");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("attend_class", { p_class: classId });
  if (error || !data) {
    console.error("attendClass failed:", error?.code);
    return fail(error?.code === "P0002" ? "수업 내용이 아직 없거나 휴강이에요." : error?.code === "42501" ? "이 체육관 관원이 아니에요." : "출석하지 못했어요. 다시 눌러 주세요.");
  }
  revalidatePath("/app", "layout");
  revalidatePath("/gym", "layout");
  return { ok: true, id: data };
}

// ---------- 코멘트 (FLOW 8-3) ----------
export async function addComment(gymId: string, logId: string, body: string): Promise<Res<{ id: string }>> {
  if (!UUID.test(gymId) || !UUID.test(logId)) return fail("없는 기록이에요.");
  const b = body.trim();
  if (b.length < 1 || b.length > 500) return fail("코멘트는 1~500자로 적어 주세요.");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("comment_log", { p_log: logId, p_gym: gymId, p_body: b });
  if (error || !data) {
    console.error("addComment failed:", error?.code);
    return fail(error?.code === "42501" ? "이 체육관 관원의 기록이 아니에요." : "남기지 못했어요. 다시 눌러 주세요.");
  }
  revalidatePath("/gym", "layout");
  return { ok: true, id: data };
}
export async function editComment(id: string, body: string): Promise<Res> {
  if (!UUID.test(id)) return fail("없는 코멘트예요.");
  const b = body.trim();
  if (b.length < 1 || b.length > 500) return fail("코멘트는 1~500자로 적어 주세요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("log_comments").update({ body: b, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail("고치지 못했어요.");
  revalidatePath("/gym", "layout");
  return { ok: true };
}
export async function deleteComment(id: string): Promise<Res> {
  if (!UUID.test(id)) return fail("없는 코멘트예요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("log_comments").delete().eq("id", id);
  if (error) return fail("지우지 못했어요.");
  revalidatePath("/gym", "layout");
  return { ok: true };
}

// ---------- 설정 (관장) ----------
export async function updateGym(gymId: string, input: { name: string; si: string; gu: string; network: string }): Promise<Res> {
  if (!UUID.test(gymId)) return fail("없는 체육관이에요.");
  const name = input.name.trim();
  if (name.length < 1 || name.length > 30) return fail("체육관 이름은 1~30자로 적어 주세요.");
  if (input.network && !isGymNetwork(input.network)) return fail("목록에 있는 네트워크만 고를 수 있어요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("gyms")
    .update({ name, region_si: input.si.trim().slice(0, 20) || null, region_gu: input.gu.trim().slice(0, 20) || null, network: input.network || null })
    .eq("id", gymId);
  if (error) return fail("저장하지 못했어요.");
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}
export async function regenCode(gymId: string, which: "join" | "coach"): Promise<Res<{ code: string }>> {
  if (!UUID.test(gymId)) return fail("없는 체육관이에요.");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("regen_gym_code", { p_gym: gymId, p_which: which });
  if (error || !data) return fail("다시 만들지 못했어요.");
  revalidatePath("/gym", "layout");
  return { ok: true, code: data };
}
export async function demoteCoach(gymId: string, userId: string): Promise<Res> {
  if (!UUID.test(gymId) || !UUID.test(userId)) return fail("없는 사람이에요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("gym_members").update({ role: "member" }).eq("gym_id", gymId).eq("user_id", userId).eq("role", "coach");
  if (error) return fail("바꾸지 못했어요.");
  revalidatePath("/gym", "layout");
  return { ok: true };
}
export async function transferOwner(gymId: string, userId: string): Promise<Res> {
  if (!UUID.test(gymId) || !UUID.test(userId)) return fail("없는 사람이에요.");
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("transfer_gym_owner", { p_gym: gymId, p_user: userId });
  if (error) return fail("넘기지 못했어요.");
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}
export async function deleteGym(gymId: string): Promise<Res> {
  if (!UUID.test(gymId)) return fail("없는 체육관이에요.");
  const supabase = await createSupabaseServer();
  const { error, count } = await supabase.from("gyms").delete({ count: "exact" }).eq("id", gymId);
  if (error || !count) return fail("지우지 못했어요. 관장만 지울 수 있어요.");
  (await cookies()).delete(GYM_COOKIE);
  revalidatePath("/gym", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

// 관장 화면 기술 팝업(D-136) — 기술 설명만(이름 · 포지션 · 세팅 과정 · 규정). 읽기 권한은 techniques 접근 규칙 그대로
export type TechniqueCard = {
  slug: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  position: string;
  positionSlug: string | null;
  steps: string[];
  rules: string[];
};
export async function getTechniqueCard(slug: string): Promise<TechniqueCard | null> {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("techniques")
    .select("slug, name_ko, name_en, aliases, steps, rules, positions(slug, name_ko)")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    slug: data.slug,
    nameKo: data.name_ko,
    nameEn: data.name_en,
    aliases: data.aliases ?? [],
    position: data.positions?.name_ko ?? "",
    positionSlug: data.positions?.slug ?? null,
    steps: data.steps ?? [],
    rules: data.rules ?? [],
  };
}
