"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isBelt, type Belt } from "@/lib/belt";

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
  revalidatePath("/app", "layout"); // /app 아래 화면 전부(홈 · 복습 · 내 기술 · 기록) 미리 불러온 내용까지 새로
  return { ok: true };
}
