"use client";

import { useOptimistic, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// 기록 '목록 · 달력' (D-98) — 누르면 버튼과 화면(스켈레톤)이 바로 바뀌고, 데이터는 뒤에서 불러온다(2026-10-31).
export function LogsView({
  cal,
  children,
  listSkeleton,
  calSkeleton,
}: {
  cal: boolean;
  children: ReactNode;
  listSkeleton: ReactNode;
  calSkeleton: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname(); // /app/logs
  const [, startNav] = useTransition();
  const [shown, setShown] = useOptimistic(cal);

  function pick(next: boolean) {
    if (next === shown) return;
    startNav(() => {
      setShown(next);
      router.replace(next ? `${pathname}?view=cal` : pathname, { scroll: false });
    });
  }

  return (
    <>
      <ViewSwitch cal={shown} onPick={pick} />
      {shown === cal ? children : shown ? calSkeleton : listSkeleton}
    </>
  );
}

// 기술 고르기 칩과 같은 모양(DESIGN 기록 달력). onPick 이 없으면 처음 불러오는 동안의 자리
export function ViewSwitch({ cal, onPick }: { cal: boolean; onPick?: (cal: boolean) => void }) {
  const chip = (on: boolean) =>
    cn(
      "flex h-10 flex-1 items-center justify-center rounded-full border text-[15px] font-medium transition-colors",
      on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
    );
  return (
    <div role="group" aria-label="보기" className="flex gap-2">
      <button type="button" aria-pressed={!cal} className={chip(!cal)} onClick={() => onPick?.(false)}>
        목록
      </button>
      <button type="button" aria-pressed={cal} className={chip(cal)} onClick={() => onPick?.(true)}>
        달력
      </button>
    </div>
  );
}
