"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setBelt } from "@/app/app/actions";
import { BELTS, BELT_BG, BELT_ROWS, BELT_WEEKS, WEEK_SHADES, type Belt } from "@/lib/belt";
import { formatKoreanDate } from "@/lib/seoul-date";
import { cn } from "@/lib/utils";

// 홈 "수련 벨트" (D-33, DESIGN 2) — 최근 2년(104주)을 1주 1칸으로, 그 주 수련(기록) 횟수만큼 밝게.
// 바깥은 내 벨트 색(양옆 너비의 약 5%, 위아래 높이의 약 1%), 가운데는 검정 바탕 + 살짝 둥근 네모.
export function TrainingBelt({ weeks, belt: initialBelt }: { weeks: { start: string; count: number }[]; belt: Belt }) {
  const [belt, setBeltState] = useState<Belt>(initialBelt);
  const [picking, setPicking] = useState(false);
  const [, startSaving] = useTransition();

  const total = weeks.reduce((n, w) => n + w.count, 0);
  const color = BELTS.find((b) => b.value === belt)?.color ?? BELTS[0].color;
  const label = BELTS.find((b) => b.value === belt)?.label ?? "화이트";

  function choose(next: Belt) {
    const prev = belt;
    setBeltState(next);
    setPicking(false);
    startSaving(async () => {
      const res = await setBelt(next).catch(() => null);
      if (!res?.ok) {
        setBeltState(prev);
        toast.error("벨트 색을 저장하지 못했어요. 다시 눌러 주세요.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-2" aria-label="수련 벨트">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold">수련 벨트</h2>
        <span className="text-[13px] font-medium text-muted-foreground tabular-nums">최근 2년 · {total}번</span>
      </div>

      {/* 벨트: 바깥 = 벨트 색, 위아래는 높이의 약 1%(≈ 너비의 0.17%) */}
      <div
        className="rounded-[3px]"
        style={{ backgroundColor: color, padding: "max(1px, 0.17%) 5%" }}
        role="img"
        aria-label={`${label} 벨트, 최근 2년 동안 ${total}번 수련`}
      >
        <div
          className="grid gap-[2px] p-[3px]"
          style={{
            backgroundColor: BELT_BG,
            gridTemplateColumns: `repeat(${BELT_WEEKS / BELT_ROWS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${BELT_ROWS}, auto)`,
            gridAutoFlow: "column",
          }}
        >
          {weeks.map((w) => (
            <span
              key={w.start}
              title={`${formatKoreanDate(w.start)} 주 · ${w.count}번`}
              className="aspect-square rounded-[2px]"
              style={{ backgroundColor: WEEK_SHADES[Math.min(w.count, 5)] }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground" aria-hidden>
          적게
          {WEEK_SHADES.map((c) => (
            <span key={c} className="size-2.5 rounded-[2px] ring-1 ring-border" style={{ backgroundColor: c }} />
          ))}
          주 5번+
        </span>
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          aria-expanded={picking}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-medium text-muted-foreground hover:bg-muted"
        >
          <span className="size-3 rounded-full ring-1 ring-border" style={{ backgroundColor: color }} />
          {label} 벨트
        </button>
      </div>

      {picking && (
        <div className="flex flex-wrap justify-end gap-1.5" role="radiogroup" aria-label="벨트 색">
          {BELTS.map((b) => (
            <button
              key={b.value}
              type="button"
              role="radio"
              aria-checked={b.value === belt}
              onClick={() => choose(b.value)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium",
                b.value === belt ? "border-foreground" : "border-border bg-card hover:bg-muted",
              )}
            >
              <span className="size-3 rounded-full ring-1 ring-border" style={{ backgroundColor: b.color }} />
              {b.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
