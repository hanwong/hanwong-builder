"use client";

import { cn } from "@/lib/utils";
import { LEVELS, type Level } from "@/lib/mock/log-seed";

// 숙련도 5단계 칩(D-06) — 정리 화면 기술 카드와 기술 상세가 함께 쓴다. 선택 = 라임.
export function LevelPicker({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string; // 읽기 프로그램용 "○○ 숙련도"
  value: Level | null;
  onChange: (level: Level) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {LEVELS.map((lv) => {
        const selected = lv.value === value;
        return (
          <button
            key={lv.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(lv.value)}
            className={cn(
              "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-60",
              selected
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {lv.label}
          </button>
        );
      })}
    </div>
  );
}
