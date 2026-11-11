import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { LogDetail } from "@/components/app/log-detail";
import { cookies } from "next/headers";
import { getLog } from "@/lib/log-data";
import { getSharedLog } from "@/lib/shared-log-data";
import { SharedLogView } from "@/components/app/shared-log-view";
import { LogComments } from "@/components/app/log-comments";

export const metadata: Metadata = {
  title: "기록 보기 — Re:Re:Roll",
};

// 저장한 기록 보기 · 고치기 (D-25, T-22). 본인 기록만(RLS) — 남의 기록 주소면 공유를 켠 기록만 보기 화면(D-123), 아니면 "없음".
export default function LogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // uuid 모양이 아니면 DB 에 묻지 않고 "없음"
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let log;
  try {
    log = await getLog(id);
  } catch (e) {
    console.error("log detail failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href={`/app/log/${id}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (log)
    return (
      <div className="flex flex-col gap-5">
        <LogDetail log={log} />
        {/* 관장님 코멘트 (D-127) — 없으면 안 보인다 */}
        <Suspense fallback={null}>
          <LogComments logId={id} />
        </Suspense>
      </div>
    );
  // 내 것이 아니다 — 같이 수업한 사람이 공유를 켠 기록이면 가져오기 화면
  let shared;
  try {
    shared = await getSharedLog(id);
  } catch (e) {
    console.error("shared log failed:", e instanceof Error ? e.message : "unknown");
    shared = null;
  }
  if (!shared) notFound();
  return <SharedLogView log={shared} />;
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}
