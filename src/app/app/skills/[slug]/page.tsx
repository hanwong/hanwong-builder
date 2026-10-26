import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillDetail } from "@/components/app/skill-detail";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSkill } from "@/lib/skill-detail-data";

export const metadata: Metadata = {
  title: "기술 상세 — Re:Re:롤",
};

// 기술 상세 (T-10b). 주소는 기술 고유 키(slug) — 예: /app/skills/half-guard-underhook
export default function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<SkillSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) notFound();
  const supabase = await createSupabaseServer(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let skill;
  try {
    skill = await getSkill(supabase, slug);
  } catch (e) {
    console.error("skill detail failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        {/* 새로고침은 화면 전체를 다시 읽어야 해서 일부러 <a> */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href={`/app/skills/${slug}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!skill) notFound();
  // 숙련도를 바꾸고 다시 들어와도 최신 값으로 — 지나간 화면 상태가 남지 않게
  return <SkillDetail key={`${skill.slug}:${skill.level}`} skill={skill} />;
}

function SkillSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-8 w-full rounded-full" />
    </div>
  );
}
