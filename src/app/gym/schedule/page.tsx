import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { GymScheduleView } from "@/components/gym/gym-schedule-view";
import { GymEmpty } from "@/components/gym/gym-empty";
import { getGymSchedule } from "@/lib/gym-data";

export const metadata: Metadata = { title: "수업 스케줄 — Re:Re:롤" };

// 수업 스케줄 (D-127, FLOW 8-3) — 요일 7묶음 · 수업 추가 · 수정 · 없애기
export default function GymSchedulePage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await cookies();
  let data;
  try {
    data = await getGymSchedule();
  } catch (e) {
    console.error("gym schedule failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/gym/schedule" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data) return <GymEmpty />;
  return <GymScheduleView data={data} />;
}
