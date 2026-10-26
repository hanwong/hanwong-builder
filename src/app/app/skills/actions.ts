"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LEVELS, type Level } from "@/lib/mock/log-seed";

export type LevelResult = { ok: true } | { ok: false; message: string };

const LEVEL_VALUES = new Set(LEVELS.map((l) => l.value));

// 기술 상세에서 숙련도 저장 — 하단 "숙련도 저장"을 누르면 (T-10b, D-06 · D-27). 숙련도만 바꾸고 복습 카드는 만들지 않는다.
export async function setLevel(slug: string, level: Level): Promise<LevelResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  if (typeof slug !== "string" || !LEVEL_VALUES.has(level)) return { ok: false, message: "잘못된 요청이에요." };

  const { data: t } = await supabase.from("techniques").select("id").eq("slug", slug).maybeSingle();
  if (!t) return { ok: false, message: "기술을 찾지 못했어요." };

  const { error } = await supabase
    .from("technique_levels")
    .upsert(
      { user_id: user.id, technique_id: t.id, level, updated_at: new Date().toISOString() },
      { onConflict: "user_id,technique_id" },
    );
  if (error) {
    console.error("setLevel failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false, message: "저장 못 했어요 — 다시 눌러 주세요." };
  }
  revalidatePath("/app/skills");
  return { ok: true };
}
