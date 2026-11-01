import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogList } from "@/components/app/log-list";
import { LogsCalendar } from "@/components/app/logs-calendar";
import { LogsShell, ViewSkeleton, ViewSwitch } from "@/components/app/logs-view";
import { getLogs, getLogsInMonth, LOGS_PAGE } from "@/lib/logs-data";
import { seoulToday } from "@/lib/seoul-date";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isOperator } from "@/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "기록 — Re:Re:롤",
};

type Params = Promise<{ n?: string; view?: string; m?: string }>;

// 기록 목록 (T-33, D-40) — 하단 '기록' 탭. 최신순, 30개씩 더 보기(?n=60 …). 달력 보기는 ?view=cal&m=YYYY-MM (D-98).
export default function LogsPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="flex flex-col gap-5 pb-16">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">기록</h1>
        <Suspense>
          <AskButton />
        </Suspense>
      </div>
      {/* 기본 화면 두 개는 주소를 읽지 않아 미리 받기에 들어간다 — 탭을 누르면 바로(2026-11-01) */}
      <Suspense
        fallback={
          <>
            <ViewSwitch cal={false} />
            <LogsSkeleton />
          </>
        }
      >
        <LogsShell
          defaultList={
            <Suspense fallback={<LogsSkeleton />}>
              <Loader />
            </Suspense>
          }
          defaultCal={
            <Suspense fallback={<CalendarSkeleton />}>
              <CalendarLoader />
            </Suspense>
          }
          urlContent={
            <Suspense fallback={<ViewSkeleton list={<LogsSkeleton />} cal={<CalendarSkeleton />} />}>
              <Content searchParams={searchParams} />
            </Suspense>
          }
        />
      </Suspense>
    </div>
  );
}

// 질문하기(D-100) — 지금은 운영자에게만 보인다
async function AskButton() {
  await cookies();
  if (!(await isOperator(await createSupabaseServer()))) return null;
  return (
    <Button asChild variant="outline" className="h-9 gap-1 rounded-full px-3.5 text-[14px] shadow-none">
      <Link href="/app/ask">
        <MessageCircleQuestion className="size-4" strokeWidth={2} aria-hidden />
        질문하기
      </Link>
    </Button>
  );
}

// 주소에 값이 있을 때(더 보기 ?n= · 다른 달 ?m=)만. 기본 화면이면 LogsShell 이 기본 화면을 쓰니 아무것도 안 그린다
async function Content({ searchParams }: { searchParams: Params }) {
  const { n, view, m } = await searchParams;
  const cal = view === "cal";
  if (cal ? !m : !n) return null;
  return cal ? <CalendarLoader m={m} /> : <Loader n={n} />;
}

async function Loader({ n }: { n?: string }) {
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
    return (
      <p className="text-[15px] leading-relaxed text-muted-foreground">아직 기록이 없어요. 첫 수업을 기록해 보세요.</p>
    );
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
  const month =
    m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) && m >= "2000-01" && m <= today.slice(0, 7) ? m : today.slice(0, 7);
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

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-[372px] w-full rounded-2xl" />
    </div>
  );
}
