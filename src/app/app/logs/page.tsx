import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogList } from "@/components/app/log-list";
import { getLogs, LOGS_PAGE } from "@/lib/logs-data";

export const metadata: Metadata = {
  title: "기록 — Re:Re:롤",
};

// 기록 목록 (T-33, D-40) — 하단 '기록' 탭. 최신순, 30개씩 더 보기(?n=60 …).
export default function LogsPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  return (
    <div className="flex flex-col gap-5 pb-16">
      <h1 className="text-[22px] font-bold tracking-tight">기록</h1>
      <Suspense fallback={<LogsSkeleton />}>
        <Loader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Loader({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const { n } = await searchParams;
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
