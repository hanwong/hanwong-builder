import "server-only";
import type { createSupabaseServer } from "@/lib/supabase/server";
import type { Level } from "@/lib/mock/log-seed";

// 기술 상세 (T-10b) — 기술 내용(공용) + 내 숙련도 · 복습 상태 · 그 기술이 나온 내 기록(본인 것만, RLS).
export type SkillDetail = {
  slug: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  position: string;
  steps: string[];
  draft: boolean;
  level: Level | null;
  card: { dueOn: string; reviews: number } | null;
  logs: { id: string; loggedOn: string; body: string }[]; // 날짜 최신순
};

export async function getSkill(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  slug: string,
): Promise<SkillDetail | null> {
  const { data: t, error } = await supabase
    .from("techniques")
    .select("id, slug, name_ko, name_en, aliases, steps, is_reviewed, positions(name_ko)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`skill: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  if (!t) return null;

  const [level, card, links] = await Promise.all([
    supabase.from("technique_levels").select("level").eq("technique_id", t.id).maybeSingle(),
    supabase.from("review_cards").select("due_on, reviews_count").eq("technique_id", t.id).maybeSingle(),
    supabase.from("class_log_techniques").select("class_logs(id, logged_on, body, created_at)").eq("technique_id", t.id),
  ]);
  const err = level.error ?? card.error ?? links.error;
  if (err) throw new Error(`skill mine: ${err.code ?? ""} ${err.message.slice(0, 80)}`);

  const logs = (links.data ?? [])
    .map((l) => l.class_logs)
    .filter((l): l is NonNullable<typeof l> => !!l)
    .sort((a, b) => b.logged_on.localeCompare(a.logged_on) || b.created_at.localeCompare(a.created_at))
    .map((l) => ({ id: l.id, loggedOn: l.logged_on, body: l.body }));

  return {
    slug: t.slug,
    nameKo: t.name_ko,
    nameEn: t.name_en,
    aliases: t.aliases ?? [],
    position: t.positions?.name_ko ?? "",
    steps: t.steps,
    draft: !t.is_reviewed,
    level: (level.data?.level as Level | undefined) ?? null,
    card: card.data ? { dueOn: card.data.due_on, reviews: card.data.reviews_count } : null,
    logs,
  };
}
