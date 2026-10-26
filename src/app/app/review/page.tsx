import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewSession } from "@/components/app/review-session";
import { cookies } from "next/headers";
import { getReviewData } from "@/lib/review-data";

export const metadata: Metadata = {
  title: "오늘 복습 — Re:Re:롤",
};

// 오늘 복습 (T-09). 내 카드라 요청 때 읽는다 — 그동안 카드 자리 스켈레톤.
export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let data;
  try {
    data = await getReviewData();
  } catch (e) {
    console.error("review failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/app/review" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  // 카드 묶음이 바뀌면(다른 날 · 다 푼 뒤) 처음부터 — 지나간 화면 상태가 남지 않게
  return <ReviewSession key={data.cards.map((c) => c.id).join(",")} {...data} />;
}

function ReviewSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <Skeleton className="min-h-[60vh] w-full rounded-2xl" />
    </div>
  );
}
