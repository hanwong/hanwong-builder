import "server-only";
import { queryDrillChips, type DrillChip } from "@/lib/drills-data";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Level } from "@/lib/mock/log-seed";
import { ADULT_BELTS, adultBeltOf, type AdultBelt } from "@/lib/adult-belt";
export { ADULT_BELTS, adultBeltOf, type AdultBelt };

// 벨트별 흔히 배우는 기술 (D-126) — 공용 표 belt_techniques × 내 기록 · 숙련도.
// 앱이 "익혔다"를 판정하지 않는다(D-06) — 적어 봤는지(기록 연결 또는 숙련도 있음) · 기록 횟수 · 내 숙련도만.
export type BeltSkill = {
  slug: string;
  nameKo: string;
  learned: boolean; // 적어 봤음 — 내 기록에 연결됐거나 숙련도가 있음
  count: number; // 내 기록에 나온 횟수
  level: Level | null;
};
export type BeltGroup = { slug: string; nameKo: string; skills: BeltSkill[] };
export type BeltList = { belt: AdultBelt; label: string; color: string; learned: number; total: number; groups: BeltGroup[] };
export type BeltProgress = { belt: AdultBelt; label: string; color: string; learned: number; total: number };

type Client = Awaited<ReturnType<typeof createSupabaseServer>>;

// 내 것(기본) 또는 넘겨받은 숙련도 · 기록 횟수(관장이 관원을 볼 때, D-127)로 벨트 목록을 만든다
export async function loadBeltLists(
  supabase: Client,
  mine?: { levels: Map<string, Level>; counts: Map<string, number> },
): Promise<BeltList[]> {
  const [rows, positions, levels, linked] = await Promise.all([
    supabase.from("belt_techniques").select("belt, technique_slug, sort_order").order("sort_order"),
    supabase.from("positions").select("id, slug, name_ko").order("sort_order"),
    mine ? Promise.resolve({ data: [], error: null }) : supabase.from("technique_levels").select("technique_id, level"),
    mine ? Promise.resolve({ data: [], error: null }) : supabase.from("class_log_techniques").select("technique_id"), // 내 것만(RLS)
  ]);
  const error = rows.error ?? positions.error ?? levels.error ?? linked.error;
  if (error) throw new Error(`belts: ${error.code ?? ""} ${error.message.slice(0, 80)}`);

  const slugs = [...new Set((rows.data ?? []).map((r) => r.technique_slug))];
  const techs = await supabase
    .from("techniques")
    .select("id, slug, name_ko, position_id")
    .in("slug", slugs)
    .is("owner_id", null);
  if (techs.error) throw new Error(`belts techs: ${techs.error.code ?? ""} ${techs.error.message.slice(0, 80)}`);

  const bySlug = new Map((techs.data ?? []).map((t) => [t.slug, t]));
  const levelOf = mine?.levels ?? new Map((levels.data ?? []).map((l) => [l.technique_id, l.level as Level]));
  const countOf = mine?.counts ?? new Map<string, number>();
  if (!mine) for (const l of linked.data ?? []) if (l.technique_id) countOf.set(l.technique_id, (countOf.get(l.technique_id) ?? 0) + 1);

  return ADULT_BELTS.map((b) => {
    const groups = new Map<string, BeltSkill[]>();
    for (const r of rows.data ?? []) {
      if (r.belt !== b.value) continue;
      const t = bySlug.get(r.technique_slug);
      if (!t) continue;
      const count = countOf.get(t.id) ?? 0;
      const level = levelOf.get(t.id) ?? null;
      const list = groups.get(t.position_id) ?? [];
      list.push({ slug: t.slug, nameKo: t.name_ko, learned: count > 0 || level !== null, count, level });
      groups.set(t.position_id, list);
    }
    const ordered = (positions.data ?? [])
      .map((p) => ({ slug: p.slug, nameKo: p.name_ko, skills: groups.get(p.id) ?? [] }))
      .filter((g) => g.skills.length > 0);
    const all = ordered.flatMap((g) => g.skills);
    return {
      belt: b.value,
      label: b.label,
      color: b.color,
      learned: all.filter((s) => s.learned).length,
      total: all.length,
      groups: ordered,
    };
  });
}

// 기술 탭 맨 위 카드 — 기술 탭이 자기 Promise.all 안에서 같이 부른다
export async function queryBeltProgress(supabase: Client, belt: unknown): Promise<BeltProgress> {
  const mine = adultBeltOf(belt);
  const lists = await loadBeltLists(supabase);
  const l = lists.find((x) => x.belt === mine) ?? lists[0];
  return { belt: l.belt, label: l.label, color: l.color, learned: l.learned, total: l.total };
}

export async function getBeltTechniques(): Promise<{ myBelt: AdultBelt; belts: BeltList[]; drills: DrillChip[] }> {
  "use cache: private"; // 내 데이터 — 다른 /app 화면과 같이 5분(D-45)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // 기본 드릴은 화이트 벨트 목록 위에만(D-140)
  const [belts, drills] = await Promise.all([loadBeltLists(supabase), queryDrillChips(supabase)]);
  return { myBelt: adultBeltOf(user?.user_metadata?.belt), belts, drills };
}
