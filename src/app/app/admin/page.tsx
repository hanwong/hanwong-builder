import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminDrafts } from "@/components/app/admin-drafts";
import { getAdminData } from "@/lib/admin/admin-data";

export const metadata: Metadata = {
  title: "목록 추가 대기 — Re:Re:롤",
};

// 초안 만들기(Claude)가 이 화면의 Server Action 에서 돈다 — 이름 20개면 1분 가까이 걸릴 수 있다
export const maxDuration = 120;

// 운영 화면 (D-47, T-39) — 운영자만. 아니면 없는 페이지.
export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let data;
  try {
    data = await getAdminData();
  } catch (e) {
    console.error("admin failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/app/admin" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data) notFound();
  return <AdminDrafts data={data} />;
}

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-4 w-full" />
      {Array.from({ length: 2 }, (_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-2xl" />
      ))}
    </div>
  );
}
