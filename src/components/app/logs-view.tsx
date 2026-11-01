"use client";

import { useOptimistic, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// 기록 '목록 · 달력' (D-98) — 누르면 버튼과 화면이 바로 바뀌고, 데이터는 뒤에서 불러온다(2026-10-31).
// 기본 화면(목록 처음 30개 · 이번 달 달력)은 주소를 읽지 않게 따로 받아 둬서 미리 받기(App Shell)에 들어간다 —
// 탭을 누르면 로딩 없이 바로 보인다. '더 보기' · 다른 달처럼 주소에 값이 있을 때만 urlContent 를 기다린다(2026-11-01).
export function LogsShell({
  defaultList,
  defaultCal,
  urlContent,
}: {
  defaultList: ReactNode;
  defaultCal: ReactNode;
  urlContent: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname(); // /app/logs
  const params = useSearchParams();
  const cal = params.get("view") === "cal";
  const isDefault = cal ? !params.get("m") : !params.get("n");
  const [, startNav] = useTransition();
  const [shown, setShown] = useOptimistic(cal);

  function pick(next: boolean) {
    if (next === shown) return;
    startNav(() => {
      setShown(next);
      router.replace(next ? `${pathname}?view=cal` : pathname, { scroll: false });
    });
  }

  // 바꾸는 중에는 바꿀 쪽의 기본 화면을 바로(이미 받아 둔 것), 아니면 주소대로
  const body =
    shown !== cal ? (shown ? defaultCal : defaultList) : isDefault ? (cal ? defaultCal : defaultList) : urlContent;
  return (
    <>
      <ViewSwitch cal={shown} onPick={pick} />
      {body}
    </>
  );
}

/** 주소 값을 기다리는 동안의 자리 — 주소를 보고 목록 · 달력 스켈레톤 중 하나 */
export function ViewSkeleton({ list, cal }: { list: ReactNode; cal: ReactNode }) {
  return useSearchParams().get("view") === "cal" ? cal : list;
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
