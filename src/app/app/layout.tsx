import { Suspense } from "react";
import { TabBar, TabBarFallback } from "@/components/app/tab-bar";
import { BackCacheGuard } from "@/components/app/back-cache-guard";

// 제품(/app) 공통 틀: 휴대폰 폭 한 열 + 하단 탭 4개 (DESIGN.md 4).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <BackCacheGuard />
      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
      <Suspense fallback={<TabBarFallback />}>
        <TabBar />
      </Suspense>
    </div>
  );
}
