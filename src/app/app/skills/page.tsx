import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillsList } from "@/components/app/skills-list";
import { cookies } from "next/headers";
import { getSkills } from "@/lib/skills-data";

export const metadata: Metadata = {
  title: "내 기술 — Re:Re:롤",
};

// 내 기술 (T-10). 내 숙련도가 섞이므로 요청 때 읽는다 — 그동안 목록 자리 스켈레톤.
export default function SkillsPage() {
  return (
    <Suspense fallback={<SkillsSkeleton />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let groups;
  try {
    groups = await getSkills();
  } catch (e) {
    console.error("skills failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/app/skills" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  return <SkillsList groups={groups} />;
}

function SkillsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}
