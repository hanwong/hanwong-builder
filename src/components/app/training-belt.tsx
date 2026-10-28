"use client";

import { useState, useTransition } from "react";
import { Check, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { setBelt, setStartedOn } from "@/app/app/actions";
import { StartMonthPicker } from "@/components/app/start-month-picker";
import {
  BELTS,
  BELT_BG,
  BELT_BLACK_BAR,
  BELT_ROWS,
  BELT_WEEKS,
  BELT_WHITE_EDGE,
  WEEK_SHADES,
  trainingSpan,
  type Belt,
} from "@/lib/belt";
import { formatKoreanDate } from "@/lib/seoul-date";
import { cn } from "@/lib/utils";

// 홈 "수련 벨트" (D-33, DESIGN 2) — 최근 2년(104주)을 1주 1칸으로, 그 주 수련(기록) 횟수만큼 밝게.
// 바깥은 내 벨트 색(양옆 너비의 약 5%, 위아래 높이의 약 1%), 가운데는 검정 바탕 + 살짝 둥근 네모.
// 위에 "○○ 벨트 · 수련 N년 N개월째"(D-59), 아래에 범례 · 최근 2년 횟수 · 벨트 설정(팝업: 벨트 색 · 수련 시작).
export function TrainingBelt({
  weeks,
  belt: initialBelt,
  startedOn: initialStartedOn,
  thisMonth,
}: {
  weeks: { start: string; count: number }[];
  belt: Belt;
  startedOn: string | null;
  thisMonth: string;
}) {
  const [belt, setBeltState] = useState<Belt>(initialBelt);
  const [startedOn, setStartedOnState] = useState(initialStartedOn);
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

  function changeStart(next: string) {
    if (next && next > thisMonth) return; // 이번 달까지
    const prev = startedOn;
    const value = next || null;
    setStartedOnState(value);
    startSaving(async () => {
      const res = await setStartedOn(value).catch(() => null);
      if (!res?.ok) {
        setStartedOnState(prev);
        toast.error("수련 시작을 저장하지 못했어요. 다시 골라 주세요.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-2" aria-label="수련 벨트">
      {/* 수련 기간 (D-59) — 시작을 모르면 설정으로 안내 */}
      {startedOn ? (
        <p className="text-[15px] font-semibold">
          {label} 벨트 · <span className="mark-lime">{trainingSpan(startedOn, thisMonth)}</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="self-start text-left text-[13px] font-medium text-muted-foreground underline underline-offset-4"
        >
          수련 시작을 알려 주면 몇 년째인지 보여 드려요
        </button>
      )}
      {/* 벨트: 바깥 = 벨트 색, 위아래는 높이의 약 1%(≈ 너비의 0.17%) */}
      <div
        className="rounded-[3px]"
        style={{
          backgroundColor: color,
          padding: "max(1px, 0.17%) 5%",
          // 화이트는 크림 바탕에 묻혀서 벨트 전체에 테두리(D-35)
          boxShadow: belt === "white" ? `0 0 0 1px ${BELT_WHITE_EDGE}` : undefined,
        }}
        role="img"
        aria-label={`${label} 벨트, 최근 2년 동안 ${total}번 수련`}
      >
        <div
          className="grid gap-[2px] p-[3px]"
          style={{
            // 블랙은 칸지 랭크바처럼 가운데 바탕만 빨강, 칸 색은 그대로(D-35)
            backgroundColor: belt === "black" ? BELT_BLACK_BAR : BELT_BG,
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
        <span className="flex items-center gap-1">
          <span className="text-[13px] font-medium text-muted-foreground tabular-nums">최근 2년 · {total}번</span>
          <Popover open={picking} onOpenChange={setPicking}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="벨트 설정" className="rounded-full text-muted-foreground">
                <Settings2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 gap-1 p-1.5">
              <span className="px-2 pt-1 pb-0.5 text-[12px] font-medium text-muted-foreground">벨트 색</span>
              <div role="radiogroup" aria-label="벨트 색" className="flex flex-col">
                {BELTS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    role="radio"
                    aria-checked={b.value === belt}
                    onClick={() => choose(b.value)}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-md px-2 text-[14px] hover:bg-muted",
                      b.value === belt && "font-semibold",
                    )}
                  >
                    <span className="size-3.5 rounded-full ring-1 ring-border" style={{ backgroundColor: b.color }} />
                    {b.label}
                    {b.value === belt && <Check className="ml-auto size-4" aria-hidden />}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1 border-t border-border px-2 pt-2 pb-1">
                <span className="text-[12px] font-medium text-muted-foreground">수련 시작</span>
                <StartMonthPicker
                  idPrefix="belt-start"
                  value={startedOn ?? ""}
                  thisMonth={thisMonth}
                  onChange={(v) => v && changeStart(v)}
                />
              </div>
            </PopoverContent>
          </Popover>
        </span>
      </div>
    </section>
  );
}
