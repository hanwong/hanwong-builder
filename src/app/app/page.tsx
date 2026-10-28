import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeSections, HomeSkeleton } from "@/components/app/home-sections";
import { HomeNotices } from "@/components/app/home-notices";

// 홈 (T-21, FLOW 3): ⓪ 알림(있을 때만, D-47) ① 기록하기 버튼(D-08) ② 수련 벨트 ③ 최근 기록(오늘 복습은 D-58 로 뺌) ④ 하단 탭(레이아웃).
// ② · ③ 은 로그인한 사람 데이터라 요청 때 읽는다 — 그동안 스켈레톤.
export default function AppHome() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
          Re:Re:롤
        </h1>
        <form action="/auth/signout" method="post">
          <Button variant="ghost" size="sm" type="submit" className="rounded-full text-muted-foreground">
            <LogOut data-icon="inline-start" aria-hidden />
            로그아웃
          </Button>
        </form>
      </header>

      {/* 알림 · 운영자 "목록 추가 대기" (D-47) — 없으면 안 보인다 */}
      <Suspense fallback={null}>
        <HomeNotices />
      </Suspense>

      <Button asChild className="h-12 w-full rounded-full text-base">
        <Link href="/app/log">
          <Plus data-icon="inline-start" aria-hidden />
          오늘 배운 것 기록하기
        </Link>
      </Button>

      <Suspense fallback={<HomeSkeleton />}>
        <HomeSections />
      </Suspense>
    </div>
  );
}
