import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { BeltsView } from "@/components/app/belts-view";
import { getBeltTechniques } from "@/lib/belt-techniques-data";

export const metadata: Metadata = {
  title: "벨트별 기술 — Re:Re:Roll",
};

// 벨트별 흔히 배우는 기술 (D-126). 내 기록 · 숙련도가 섞이므로 요청 때 읽는다 — 그동안 스켈레톤.
export default function BeltsPage() {
  return (
    <Suspense fallback={<BeltsSkeleton />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let data;
  try {
    data = await getBeltTechniques();
  } catch (e) {
    console.error("belts failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        {/* 새로고침은 화면 전체를 다시 읽어야 해서 일부러 <a> */}
        <a href="/app/belts" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  return <BeltsView myBelt={data.myBelt} belts={data.belts} drills={data.drills} />;
}

function BeltsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-7 w-28" />
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-xl" />
      ))}
    </div>
  );
}
