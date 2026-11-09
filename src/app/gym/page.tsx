import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { GymHomeView } from "@/components/gym/gym-home-view";
import { GymEmpty } from "@/components/gym/gym-empty";
import { getGymHome } from "@/lib/gym-data";

export const metadata: Metadata = { title: "체육관 — Re:Re:롤" };

// 체육관 홈 (D-127, FLOW 8-3) — 이번 주 줄 · 오늘 수업 · 숫자 · 가입 코드. 관장 · 코치가 아니면 등록 안내.
export default function GymPage() {
  return (
    <Suspense fallback={<GymSkeleton />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await cookies();
  let data;
  try {
    data = await getGymHome();
  } catch (e) {
    console.error("gym home failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/gym" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data) return <GymEmpty />;
  return <GymHomeView data={data} />;
}

function GymSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
