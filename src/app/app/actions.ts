"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isBelt, isStartMonth, type Belt } from "@/lib/belt";
import { seoulToday } from "@/lib/seoul-date";

// 홈 수련 벨트 색 바꾸기 (D-33) — 새 표 없이 로그인 계정 정보(user_metadata.belt)에 저장. 본인 것만 바뀐다.
export async function setBelt(belt: Belt): Promise<{ ok: boolean }> {
  if (!isBelt(belt)) return { ok: false };
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.auth.updateUser({ data: { belt } });
  if (error) {
    console.error("setBelt failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false };
  }
  revalidatePath("/app"); // 벨트 색은 홈에만 보인다 — 홈만 새로(D-45)
  return { ok: true };
}

// 수련 시작 연 · 월 (D-59) — 홈 벨트 설정에서 바꾼다. null 이면 지운다
export async function setStartedOn(startedOn: string | null): Promise<{ ok: boolean }> {
  if (startedOn !== null && (!isStartMonth(startedOn) || startedOn > seoulToday().slice(0, 7))) return { ok: false };
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.auth.updateUser({ data: { started_on: startedOn } });
  if (error) {
    console.error("setStartedOn failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false };
  }
  revalidatePath("/app");
  return { ok: true };
}

// 첫 등록 안내 (D-59) — 벨트 · 수련 시작을 한 번에 저장하고 다시 안 띄운다. skip 이면 값 없이 '봤음'만
export async function finishOnboarding(input: { belt: Belt; startedOn: string | null } | null): Promise<{ ok: boolean }> {
  const data: Record<string, unknown> = { onboarded: true };
  if (input) {
    if (!isBelt(input.belt)) return { ok: false };
    if (input.startedOn !== null && (!isStartMonth(input.startedOn) || input.startedOn > seoulToday().slice(0, 7)))
      return { ok: false };
    data.belt = input.belt;
    data.started_on = input.startedOn;
  }
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.auth.updateUser({ data });
  if (error) {
    console.error("finishOnboarding failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false };
  }
  revalidatePath("/app");
  return { ok: true };
}

// 홈 알림 "확인" (D-47) — 내 알림만 읽음으로(RLS: 자기 것만 수정)
export async function markNoticesRead(ids: string[]): Promise<{ ok: boolean }> {
  if (!Array.isArray(ids) || !ids.length || ids.length > 20 || !ids.every((i) => typeof i === "string")) return { ok: false };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("notices").update({ read_at: new Date().toISOString() }).in("id", ids).is("read_at", null);
  if (error) {
    console.error("markNoticesRead failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false };
  }
  revalidatePath("/app"); // 알림은 홈에만 보인다
  return { ok: true };
}
