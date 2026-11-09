import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassView } from "@/components/gym/class-view";
import { getClassDetail } from "@/lib/gym-data";

export const metadata: Metadata = { title: "수업 — Re:Re:롤" };

// 등록된 수업 보기 · 고치기 · 출석 명단 (D-127, FLOW 8-3)
export default function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await cookies();
  let data;
  try {
    data = await getClassDetail(id);
  } catch (e) {
    console.error("class failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href={`/gym/class/${id}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data) notFound();
  return <ClassView data={data} />;
}
