import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberView } from "@/components/gym/member-view";
import { getMemberDetail } from "@/lib/gym-data";
import type { PositionGroup } from "@/lib/skills-data";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Level } from "@/lib/mock/log-seed";

export const metadata: Metadata = { title: "관원 — Re:Re:Roll" };

// 관원 한 명 (D-127, FLOW 8-3) — 숫자 · 기술 분포 육각형 + 배운 기술(D-164, 내 기술 탭 "배운 것만"과 같은 모양) · 기록 목록
export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await cookies();
  let data;
  let learned: PositionGroup[] = [];
  try {
    data = await getMemberDetail(id);
    if (data) learned = await learnedGroups(data.levels, data.counts);
  } catch (e) {
    console.error("member failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href={`/gym/members/${id}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data) notFound();
  return <MemberView data={data} learned={learned} />;
}

// 관원이 숙련도를 매긴 기술 — 포지션 순서대로 묶음(내 기술 탭과 같은 줄 모양). 공용 기술만(관원이 만든 비공개 기술은 안 보임)
async function learnedGroups(levels: Map<string, Level>, counts: Map<string, number>): Promise<PositionGroup[]> {
  const ids = [...levels.keys()];
  if (!ids.length) return [];
  const supabase = await createSupabaseServer();
  const [positions, techniques] = await Promise.all([
    supabase.from("positions").select("id, slug, name_ko").order("sort_order"),
    supabase.from("techniques").select("id, slug, name_ko, name_en, aliases, position_id, kind, role, is_reviewed, sort_order").in("id", ids).order("sort_order"),
  ]);
  const error = positions.error ?? techniques.error;
  if (error) throw new Error(`member skills: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  const byPosition = new Map<string, PositionGroup["skills"]>();
  for (const t of techniques.data ?? []) {
    const list = byPosition.get(t.position_id) ?? [];
    list.push({ slug: t.slug, nameKo: t.name_ko, nameEn: t.name_en, aliases: t.aliases ?? [], level: levels.get(t.id) ?? null, kind: t.kind, role: t.role, draft: !t.is_reviewed, count: counts.get(t.id) ?? 0 });
    byPosition.set(t.position_id, list);
  }
  return (positions.data ?? []).map((p) => ({ slug: p.slug, nameKo: p.name_ko, skills: byPosition.get(p.id) ?? [] })).filter((g) => g.skills.length > 0);
}
