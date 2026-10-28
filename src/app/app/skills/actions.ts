"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LEVELS, type Level } from "@/lib/mock/log-seed";

export type LevelResult = { ok: true } | { ok: false; message: string };

const LEVEL_VALUES = new Set(LEVELS.map((l) => l.value));

// 기술 상세에서 숙련도 저장 — 하단 "숙련도 저장"을 누르면 (T-10b, D-06 · D-27). 숙련도만 바꾼다.
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
  revalidatePath("/app/skills", "layout"); // 숙련도는 내 기술 목록 · 상세에만 보인다(D-45)
  return { ok: true };
}

// 기술 내용 보완 제안 (D-50, T-40) — 세팅 과정(3~5줄) 고치기 + 다른 이름 더하기 + 이유(선택).
// 운영자가 확인 · 승인해야 반영된다. 한 기술에 내 대기 제안은 1개, 전체 대기 10개(DB 규칙).
export type SuggestResult = { ok: true } | { ok: false; message: string };

const line = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");

export async function suggestEdit(
  slug: string,
  input: { steps: string[]; aliases: string[]; reason: string },
): Promise<SuggestResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };
  if (typeof slug !== "string" || !input) return { ok: false, message: "잘못된 요청이에요." };

  const steps = (Array.isArray(input.steps) ? input.steps : []).map((x) => line(x, 120)).filter(Boolean);
  if (steps.length < 3 || steps.length > 5) return { ok: false, message: "세팅 과정은 3~5줄로 적어 주세요." };
  const aliases = [...new Set((Array.isArray(input.aliases) ? input.aliases : []).map((x) => line(x, 40)).filter(Boolean))];
  if (aliases.length > 5) return { ok: false, message: "다른 이름은 5개까지 더할 수 있어요." };
  const reason = line(input.reason, 200);

  const { data: t } = await supabase.from("techniques").select("id, steps, aliases").eq("slug", slug).maybeSingle();
  if (!t) return { ok: false, message: "기술을 찾지 못했어요." };
  const known = new Set((t.aliases ?? []).map((a) => a.replace(/\s+/g, "").toLowerCase()));
  const newAliases = aliases.filter((a) => !known.has(a.replace(/\s+/g, "").toLowerCase()));
  if (steps.join("\n") === t.steps.join("\n") && newAliases.length === 0)
    return { ok: false, message: "바뀐 내용이 없어요 — 세팅 과정을 고치거나 다른 이름을 더해 주세요." };

  const { error } = await supabase.from("technique_suggestions").insert({
    user_id: user.id,
    technique_id: t.id,
    steps,
    add_aliases: newAliases,
    reason: reason || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "이 기술에 보낸 제안이 아직 확인 대기 중이에요." };
    if (error.code === "42501") return { ok: false, message: "확인 대기 중인 제안이 10개라 더 보낼 수 없어요." };
    console.error("suggestEdit failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false, message: "보내지 못했어요 — 다시 눌러 주세요." };
  }
  revalidatePath("/app/skills", "layout");
  return { ok: true };
}
