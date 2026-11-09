import { Suspense } from "react";
import { GymTabBar, GymTabBarFallback } from "@/components/gym/gym-tab-bar";
import { BackCacheGuard } from "@/components/app/back-cache-guard";

// 관장 화면(/gym) 공통 틀 (D-127, DESIGN '관장님 버전') — /app 레이아웃과 같은 구조: 휴대폰 폭 한 열 + 아래 탭 4개.
export default function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden">
      <BackCacheGuard />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-28">{children}</main>
      <Suspense fallback={<GymTabBarFallback />}>
        <GymTabBar />
      </Suspense>
    </div>
  );
}
