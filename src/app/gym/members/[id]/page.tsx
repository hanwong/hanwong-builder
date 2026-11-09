import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberView } from "@/components/gym/member-view";
import { getMemberDetail } from "@/lib/gym-data";
import { loadBeltLists } from "@/lib/belt-techniques-data";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "관원 — Re:Re:롤" };

// 관원 한 명 (D-127, FLOW 8-3) — 숫자 · 벨트별 달성도(D-126 화면 그대로) · 기록 목록
export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
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
  let belts;
  try {
    data = await getMemberDetail(id);
    if (data) belts = await loadBeltLists(await createSupabaseServer(), { levels: data.levels, counts: data.counts });
  } catch (e) {
    console.error("member failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href={`/gym/members/${id}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data || !belts) notFound();
  return <MemberView data={data} belts={belts} />;
}
