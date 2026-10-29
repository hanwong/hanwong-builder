import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { mineOf, type Level } from "@/lib/mock/log-seed";

// 내 기술 (T-10) — 포지션 21개 × 기술 + 내 숙련도. 기술은 공용(로그인하면 초안 포함, D-24), 숙련도는 본인 것만(RLS).
export type SkillRow = { slug: string; nameKo: string; level: Level | null; draft: boolean; mine?: "pending" | "rejected" };
export type PositionGroup = { slug: string; nameKo: string; skills: SkillRow[] };

export async function getSkills(): Promise<PositionGroup[]> {
  "use cache: private"; // 내 데이터 — 서버에 남기지 않고 휴대폰 안에서만 재사용. stale 5분 이상이어야 미리 받기(prefetch)에 포함된다(D-45)
  cacheLife({ stale: 300 }); // 5분 — 이보다 짧으면 탭을 눌러야 그때 불러와서 로딩이 보인다
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [positions, techniques, levels] = await Promise.all([
    supabase.from("positions").select("id, slug, name_ko").order("sort_order"),
    supabase
      .from("techniques")
      .select("id, slug, name_ko, position_id, is_reviewed, owner_id, owner_status")
      // 공용 + 내가 만든 것만(D-57). 운영자는 접근 규칙상 남의 것도 읽혀서 여기서 거른다
      .or(`owner_id.is.null,owner_id.eq.${user?.id ?? "00000000-0000-0000-0000-000000000000"}`)
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
    list.push({
      slug: t.slug,
      nameKo: t.name_ko,
      level: levelOf.get(t.id) ?? null,
      draft: !t.is_reviewed,
      mine: mineOf(t.owner_id, t.owner_status),
    });
    byPosition.set(t.position_id, list);
  }
  return (positions.data ?? []).map((p) => ({ slug: p.slug, nameKo: p.name_ko, skills: byPosition.get(p.id) ?? [] }));
}
