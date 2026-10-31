import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogList } from "@/components/app/log-list";
import { LogsCalendar } from "@/components/app/logs-calendar";
import { getLogs, getLogsInMonth, LOGS_PAGE } from "@/lib/logs-data";
import { seoulToday } from "@/lib/seoul-date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "기록 — Re:Re:롤",
};

type Params = Promise<{ n?: string; view?: string; m?: string }>;

// 기록 목록 (T-33, D-40) — 하단 '기록' 탭. 최신순, 30개씩 더 보기(?n=60 …). 달력 보기는 ?view=cal&m=YYYY-MM (D-98).
export default function LogsPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="flex flex-col gap-5 pb-16">
      <h1 className="text-[22px] font-bold tracking-tight">기록</h1>
      <Suspense fallback={<ViewSwitch cal={false} />}>
        <ViewSwitchLoader searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<LogsSkeleton />}>
        <Loader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ViewSwitchLoader({ searchParams }: { searchParams: Params }) {
  const { view } = await searchParams;
  return <ViewSwitch cal={view === "cal"} />;
}

// '목록 · 달력' — 기술 고르기 칩과 같은 모양(DESIGN 기록 달력)
function ViewSwitch({ cal }: { cal: boolean }) {
  const chip = (on: boolean) =>
    cn(
      "flex h-10 flex-1 items-center justify-center rounded-full border text-[15px] font-medium transition-colors",
      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
    );
  return (
    <nav aria-label="보기" className="flex gap-2">
      <Link href="/app/logs" replace scroll={false} aria-current={!cal ? "page" : undefined} className={chip(!cal)}>
        목록
      </Link>
      <Link href="/app/logs?view=cal" replace scroll={false} aria-current={cal ? "page" : undefined} className={chip(cal)}>
        달력
      </Link>
    </nav>
  );
}

async function Loader({ searchParams }: { searchParams: Params }) {
  const { n, view, m } = await searchParams;
  if (view === "cal") return <CalendarLoader m={m} />;
  // 30 · 60 · 90 … 만, 최대 990개
  const limit = Math.min(Math.max(LOGS_PAGE, Math.floor(Number(n) / LOGS_PAGE) * LOGS_PAGE || LOGS_PAGE), 990);
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let data;
  try {
    data = await getLogs(limit);
  } catch (e) {
    console.error("logs failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/app/logs" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }

  if (data.total === 0) {
    return <p className="text-[15px] leading-relaxed text-muted-foreground">아직 기록이 없어요. 첫 수업을 기록해 보세요.</p>;
  }

  return (
    <section className="flex flex-col gap-3">
      <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
        전체 {data.total}개{data.total > data.rows.length && ` · 최근 ${data.rows.length}개`}
      </span>
      <LogList rows={data.rows} />
      {data.total > data.rows.length && (
        <Button asChild variant="secondary" className="h-11 rounded-full text-[15px]">
          <Link href={`/app/logs?n=${limit + LOGS_PAGE}`} scroll={false}>
            더 보기
          </Link>
        </Button>
      )}
    </section>
  );
}

async function CalendarLoader({ m }: { m?: string }) {
  await cookies();
  const today = seoulToday();
  // 오늘이 있는 달까지만, 이상한 값이면 이번 달
  const month = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) && m >= "2000-01" && m <= today.slice(0, 7) ? m : today.slice(0, 7);
  let rows;
  try {
    rows = await getLogsInMonth(month);
  } catch (e) {
    console.error("logs month failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href={`/app/logs?view=cal&m=${month}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  return <LogsCalendar key={month} month={month} rows={rows} today={today} />;
}

function LogsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
