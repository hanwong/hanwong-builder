import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { LogDetail } from "@/components/app/log-detail";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getLog } from "@/lib/log-data";

export const metadata: Metadata = {
  title: "기록 보기 — Re:Re:롤",
};

// 저장한 기록 보기 · 고치기 (D-25, T-22). 본인 기록만(RLS) — 남의 기록 주소면 "없음".
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
  const supabase = await createSupabaseServer(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let log;
  try {
    log = await getLog(supabase, id);
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
  if (!log) notFound();
  return <LogDetail log={log} />;
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
