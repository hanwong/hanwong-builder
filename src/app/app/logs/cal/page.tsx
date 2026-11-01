import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { LogsCalendar } from "@/components/app/logs-calendar";
import { CalendarSkeleton } from "@/components/app/logs-skeletons";
import { getThisMonthLogs } from "@/lib/logs-data";

export const metadata: Metadata = {
  title: "기록 달력 — Re:Re:롤",
};

// 기록 달력 (D-98) — 이번 달을 미리 받아 두고, 달 넘기기는 서버 액션으로(D-106). 홈 벨트를 누르면 여기(D-99).
export default function LogsCalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarLoader />
    </Suspense>
  );
}

async function CalendarLoader() {
  await cookies();
  let data;
  try {
    data = await getThisMonthLogs();
  } catch (e) {
    console.error("logs month failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/app/logs/cal" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  return (
    <LogsCalendar key={`${data.month}-${data.rows.length}`} month={data.month} rows={data.rows} today={data.today} />
  );
}
