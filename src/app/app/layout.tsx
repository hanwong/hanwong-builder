import { Suspense } from "react";
import { TabBar, TabBarFallback } from "@/components/app/tab-bar";
import { BackCacheGuard } from "@/components/app/back-cache-guard";

// 제품(/app) 공통 틀: 휴대폰 폭 한 열 + 하단 탭 4개 (DESIGN.md 4).
// 화면 전체 대신 main 안쪽만 스크롤한다 — 페이지가 통째로 스크롤되면 아이폰 브라우저 아래 주소창이 접혔다 펴지며
// 하단 탭 · 저장 버튼이 따라 오르내린다(2026-10-28 본인 신고, 아이폰 크롬).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden">
      <BackCacheGuard />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-28">{children}</main>
      <Suspense fallback={<TabBarFallback />}>
        <TabBar />
      </Suspense>
    </div>
  );
}
