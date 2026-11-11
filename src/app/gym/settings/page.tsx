import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
import { GymSettingsView } from "@/components/gym/gym-settings-view";
import { GymEmpty } from "@/components/gym/gym-empty";
import { getGymSettings } from "@/lib/gym-data";

export const metadata: Metadata = { title: "체육관 설정 — Re:Re:Roll" };

// 체육관 설정 (D-127, FLOW 8-3) — 이름 · 지역 · 코드 다시 만들기 · 코치 · 관장 넘기기 · 삭제. 코치는 보기 · 나가기만
export default function GymSettingsPage() {
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
    data = await getGymSettings();
  } catch (e) {
    console.error("gym settings failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/gym/settings" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!data) return <GymEmpty />;
  return <GymSettingsView data={data} />;
}
