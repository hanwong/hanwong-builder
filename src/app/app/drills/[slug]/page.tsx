import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { DrillDetail } from "@/components/app/drill-detail";
import { getDrill } from "@/lib/drills-data";

export const metadata: Metadata = {
  title: "기본 드릴 — Re:Re:롤",
};

// 드릴 (D-112). 주소는 드릴 고유 키(slug) — 예: /app/drills/shrimp
export default function DrillPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<DrillSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) notFound();
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let drill;
  try {
    drill = await getDrill(slug);
  } catch (e) {
    console.error("drill failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        {/* 새로고침은 화면 전체를 다시 읽어야 해서 일부러 <a> */}
        <a href={`/app/drills/${slug}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!drill) notFound();
  return <DrillDetail drill={drill} />;
}

function DrillSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}
