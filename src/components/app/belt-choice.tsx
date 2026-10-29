"use client";

import { Check } from "lucide-react";
import { BELTS, BELT_WHITE_EDGE, LIGHT_BELTS, type Belt } from "@/lib/belt";
import { cn } from "@/lib/utils";

// 벨트 색 고르기 — 성인 다섯 칸 + 유소년 네 칸(D-78). 시작하기(D-59)와 홈 벨트 설정이 같이 쓴다
export function BeltChoice({
  value,
  onChange,
  labelledBy,
}: {
  value: Belt;
  onChange: (b: Belt) => void;
  labelledBy: string;
}) {
  const adult = BELTS.filter((b) => !("youth" in b));
  const youth = BELTS.filter((b) => "youth" in b);
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {adult.map((b) => (
          <BeltButton key={b.value} belt={b} on={b.value === value} onChange={onChange} />
        ))}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">유소년</span>
      <div className="grid grid-cols-5 gap-1.5">
        {youth.map((b) => (
          <BeltButton key={b.value} belt={b} on={b.value === value} onChange={onChange} small />
        ))}
      </div>
    </div>
  );
}

function BeltButton({
  belt: b,
  on,
  onChange,
  small,
}: {
  belt: (typeof BELTS)[number];
  on: boolean;
  onChange: (b: Belt) => void;
  small?: boolean; // 유소년 줄은 조금 작게
}) {
  const light = LIGHT_BELTS.includes(b.value);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={() => onChange(b.value)}
      className={cn(
        "flex flex-col items-center rounded-xl font-medium ring-1 transition-colors",
        small ? "gap-1 py-1.5 text-[12px]" : "gap-1.5 py-2 text-[13px]",
        on ? "bg-accent text-accent-foreground ring-foreground" : "ring-border hover:bg-muted",
      )}
    >
      <span
        className={cn("flex items-center justify-center rounded-[2px]", small ? "h-2.5 w-7" : "h-3 w-9")}
        style={{
          backgroundColor: b.color,
          boxShadow: b.value === "white" ? `0 0 0 1px ${BELT_WHITE_EDGE}` : undefined,
        }}
        aria-hidden
      >
        {on && <Check className={cn(small ? "size-2.5" : "size-3", light ? "text-foreground" : "text-white")} strokeWidth={3} />}
      </span>
      {b.label}
    </button>
  );
}
