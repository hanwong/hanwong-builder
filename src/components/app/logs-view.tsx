"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// 기록 '목록 · 달력' (D-98) — 두 화면은 각각 주소(/app/logs · /app/logs/cal)라 둘 다 미리 받아 두고, 누르면 바로 바뀐다(D-106).
// 기술 고르기 칩과 같은 모양(DESIGN 기록 달력).
export function ViewSwitch() {
  const cal = usePathname().startsWith("/app/logs/cal");
  const chip = (on: boolean) =>
    cn(
      "flex h-10 flex-1 items-center justify-center rounded-full border text-[15px] font-medium transition-colors",
      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
    );
  return (
    <div role="group" aria-label="보기" className="flex gap-2">
      <Link href="/app/logs" replace scroll={false} aria-current={!cal ? "page" : undefined} className={chip(!cal)}>
        목록
      </Link>
      <Link href="/app/logs/cal" replace scroll={false} aria-current={cal ? "page" : undefined} className={chip(cal)}>
        달력
      </Link>
    </div>
  );
}
