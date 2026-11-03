import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { AskForm } from "@/components/app/ask-form";
import { createSupabaseServer } from "@/lib/supabase/server";
import { askQuota } from "@/lib/ask/quota";

export const metadata: Metadata = {
  title: "질문하기 — Re:Re:롤",
};
export const maxDuration = 60; // AI 가 기술 지도를 몇 번 찾아보고 답한다(보통 10~30초)

// 질문하기 (D-100 · D-115) — 로그인한 모든 사용자, 하루 3번.
export default function AskPage() {
  return (
    <div className="flex flex-col gap-5 pb-16">
      <h1 className="text-[22px] font-bold tracking-tight">질문하기</h1>
      <Suspense fallback={<Skeleton className="h-[22dvh] w-full rounded-2xl" />}>
        <Gate />
      </Suspense>
    </div>
  );
}

async function Gate() {
  await cookies();
  const { left, limit } = await askQuota(await createSupabaseServer());
  return <AskForm left={left} limit={limit} />;
}
