import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { MembersView } from "@/components/gym/members-view";
import { GymEmpty } from "@/components/gym/gym-empty";
import { getMembers } from "@/lib/gym-data";

export const metadata: Metadata = { title: "관원 — Re:Re:Roll" };

// 관원 목록 (D-127, FLOW 8-3)
export default function MembersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await cookies();
  let data;
  try {
    data = await getMembers();
  } catch (e) {
    console.error("members failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/gym/members" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data) return <GymEmpty />;
  return <MembersView data={data} />;
}
