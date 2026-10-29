import { Suspense } from "react";
import type { Viewport } from "next";
import { TabBar, TabBarFallback } from "@/components/app/tab-bar";
import { BackCacheGuard } from "@/components/app/back-cache-guard";

// 제품(/app) 공통 틀: 휴대폰 폭 한 열 + 하단 탭 4개 (DESIGN.md 4).
// 화면 전체 대신 main 안쪽만 스크롤한다 — 페이지가 통째로 스크롤되면 아이폰 브라우저 아래 주소창이 접혔다 펴지며
// 하단 탭 · 저장 버튼이 따라 오르내린다(2026-10-28 본인 신고, 아이폰 크롬).
// 아이폰(iOS 26)은 상태 표시줄 밑으로 지나가는 내용을 흐리게 비춘다(2026-10-30 본인 신고). 화면을 끝까지 쓰게 하고(cover)
// 틀 위쪽을 상태 표시줄 높이만큼 크림색으로 비워, 스크롤되는 내용이 그 밑으로 들어가지 않게 한다.
export const viewport: Viewport = { viewportFit: "cover", themeColor: "#FAF9F4" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
      <BackCacheGuard />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-28">{children}</main>
      <Suspense fallback={<TabBarFallback />}>
        <TabBar />
      </Suspense>
    </div>
  );
}
