import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";

// 기본 드릴 (D-112) — 공용 표 drills(누구나 보기). 기술 탭 · 화이트 벨트 홈의 칩 줄과 드릴 화면.
export type DrillChip = { slug: string; nameKo: string };
export type Drill = {
  slug: string;
  nameKo: string;
  nameEn: string; // 유튜브 검색용
  aliases: string[];
  summary: string;
  steps: string[];
  tips: string[];
  why: string[];
  related: { slug: string; nameKo: string; position: string }[]; // 이어지는 기술 — 적어 둔 순서대로
};

type Client = Awaited<ReturnType<typeof createSupabaseServer>>;

// 칩 줄 — 홈 · 기술 탭이 자기 Promise.all 안에서 같이 부른다
export async function queryDrillChips(supabase: Client): Promise<DrillChip[]> {
  const { data, error } = await supabase.from("drills").select("slug, name_ko").order("sort_order");
  if (error) throw new Error(`drills: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  return (data ?? []).map((d) => ({ slug: d.slug, nameKo: d.name_ko }));
}

export async function getDrill(slug: string): Promise<Drill | null> {
  "use cache: private"; // 다른 /app 화면과 같이 — stale 5분 이상이어야 미리 받기(prefetch)에 포함된다(D-45)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();

  const { data: d, error } = await supabase
    .from("drills")
    .select("slug, name_ko, name_en, aliases, summary, steps, tips, why, related_techniques")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`drill: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  if (!d) return null;

  const { data: techs, error: tErr } = await supabase
    .from("techniques")
    .select("slug, name_ko, positions(name_ko)")
    .in("slug", d.related_techniques)
    .is("owner_id", null);
  if (tErr) throw new Error(`drill techs: ${tErr.code ?? ""} ${tErr.message.slice(0, 80)}`);
  const bySlug = new Map((techs ?? []).map((t) => [t.slug, t]));

  return {
    slug: d.slug,
    nameKo: d.name_ko,
    nameEn: d.name_en,
    aliases: d.aliases,
    summary: d.summary,
    steps: d.steps,
    tips: d.tips,
    why: d.why,
    related: d.related_techniques.flatMap((s) => {
      const t = bySlug.get(s);
      return t ? [{ slug: t.slug, nameKo: t.name_ko, position: t.positions?.name_ko ?? "" }] : [];
    }),
  };
}
