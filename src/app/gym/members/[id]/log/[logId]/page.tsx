import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberLogView } from "@/components/gym/member-log-view";
import { getMemberLog } from "@/lib/gym-data";

export const metadata: Metadata = { title: "관원 기록 — Re:Re:롤" };

// 관원 기록 · 코멘트 (D-127, FLOW 8-3)
export default function MemberLogPage({ params }: { params: Promise<{ id: string; logId: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ id: string; logId: string }> }) {
  const { id, logId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(logId)) notFound();
  await cookies();
  let data;
  try {
    data = await getMemberLog(logId);
  } catch (e) {
    console.error("member log failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href={`/gym/members/${id}/log/${logId}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data || data.log.userId !== id) notFound();
  return <MemberLogView data={data} />;
}
