import "server-only";
import type { createSupabaseServer } from "@/lib/supabase/server";
import type { Level } from "@/lib/mock/log-seed";

// 내 기술 (T-10) — 포지션 19개 × 기술 + 내 숙련도. 기술은 공용(로그인하면 초안 포함, D-24), 숙련도는 본인 것만(RLS).
export type SkillRow = { slug: string; nameKo: string; level: Level | null; draft: boolean };
export type PositionGroup = { slug: string; nameKo: string; skills: SkillRow[] };

export async function getSkills(supabase: Awaited<ReturnType<typeof createSupabaseServer>>): Promise<PositionGroup[]> {
  const [positions, techniques, levels] = await Promise.all([
    supabase.from("positions").select("id, slug, name_ko").order("sort_order"),
    supabase
      .from("techniques")
      .select("id, slug, name_ko, position_id, is_reviewed")
      .order("sort_order")
      .limit(2000),
    supabase.from("technique_levels").select("technique_id, level"),
  ]);
  const error = positions.error ?? techniques.error ?? levels.error;
  if (error) throw new Error(`skills: ${error.code ?? ""} ${error.message.slice(0, 80)}`);

  const levelOf = new Map((levels.data ?? []).map((l) => [l.technique_id, l.level as Level]));
  const byPosition = new Map<string, SkillRow[]>();
  for (const t of techniques.data ?? []) {
    const list = byPosition.get(t.position_id) ?? [];
    list.push({ slug: t.slug, nameKo: t.name_ko, level: levelOf.get(t.id) ?? null, draft: !t.is_reviewed });
    byPosition.set(t.position_id, list);
  }
  return (positions.data ?? []).map((p) => ({ slug: p.slug, nameKo: p.name_ko, skills: byPosition.get(p.id) ?? [] }));
}
