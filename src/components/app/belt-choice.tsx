"use client";

import { Check } from "lucide-react";
import { BELTS, BELT_WHITE_EDGE, type Belt } from "@/lib/belt";
import { cn } from "@/lib/utils";

// 벨트 색 다섯 칸 고르기 — 시작하기(D-59)와 홈 벨트 설정이 같이 쓴다
export function BeltChoice({
  value,
  onChange,
  labelledBy,
}: {
  value: Belt;
  onChange: (b: Belt) => void;
  labelledBy: string;
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-5 gap-2">
      {BELTS.map((b) => {
        const on = b.value === value;
        return (
          <button
            key={b.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(b.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl py-2 text-[13px] font-medium ring-1 transition-colors",
              on ? "bg-accent text-accent-foreground ring-foreground" : "ring-border hover:bg-muted",
            )}
          >
            <span
              className="flex h-3 w-9 items-center justify-center rounded-[2px]"
              style={{
                backgroundColor: b.color,
                boxShadow: b.value === "white" ? `0 0 0 1px ${BELT_WHITE_EDGE}` : undefined,
              }}
              aria-hidden
            >
              {on && <Check className={cn("size-3", b.value === "white" ? "text-foreground" : "text-white")} strokeWidth={3} />}
            </span>
            {b.label}
          </button>
        );
      })}
    </div>
  );
}
