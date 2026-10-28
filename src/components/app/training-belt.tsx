"use client";

import { useEffect, useState, useTransition, type CSSProperties } from "react";
import { Settings, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BeltChoice } from "@/components/app/belt-choice";
import { useFloatingDialog } from "@/lib/use-floating-dialog";
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

// 이 탭에서 물결을 이미 보여 줬나(서버에서는 늘 false — 바꾸는 건 브라우저 effect 에서만)
let wavePlayed = false;
const WAVE_STEP = 45; // 세로줄(주) 사이 간격 ms — 26줄이면 약 1.2초에 걸쳐 지나간다

// 홈 "수련 벨트" (D-33, DESIGN 2) — 최근 2년(104주)을 1주 1칸으로, 그 주 수련(기록) 횟수만큼 밝게.
// 바깥은 내 벨트 색(양옆 너비의 약 5%, 위아래 높이의 약 1%), 가운데는 검정 바탕 + 살짝 둥근 네모.
// 위에 "○○ 벨트 · 수련 N년 N개월째"(D-59) + 오른쪽 끝 톱니바퀴(벨트 설정 팝업: 벨트 색 · 수련 시작), 아래에 범례 · 최근 2년 횟수.
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
  // 벨트 물결(D-65) — 이 탭에서 홈을 처음 열 때만. 다른 화면 갔다 오면 다시 안 한다
  const [wave, setWave] = useState(() => !wavePlayed);
  useEffect(() => {
    wavePlayed = true;
  }, []);
  const floating = useFloatingDialog(picking);
  const [, startSaving] = useTransition();

  const total = weeks.reduce((n, w) => n + w.count, 0);
  const color = BELTS.find((b) => b.value === belt)?.color ?? BELTS[0].color;
  const label = BELTS.find((b) => b.value === belt)?.label ?? "화이트";

  function choose(next: Belt) {
    const prev = belt;
    setBeltState(next);
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
      {/* 수련 기간 (D-59) + 오른쪽 끝 벨트 설정(톱니바퀴) */}
      <div className="flex items-center gap-2">
        {startedOn ? (
          <p className="min-w-0 flex-1 text-[15px] font-semibold">
            {label} 벨트 · <span className="mark-lime">{trainingSpan(startedOn, thisMonth)}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="min-w-0 flex-1 text-left text-[13px] font-medium text-muted-foreground underline underline-offset-4"
          >
            수련 시작을 알려 주면 몇 년째인지 보여 드려요
          </button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="벨트 설정"
          className="-mr-1.5 shrink-0 rounded-full text-muted-foreground"
          onClick={() => setPicking(true)}
        >
          <Settings />
        </Button>
      </div>
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
          {/* 첫 로딩 때 한 번 — 칸들이 세로줄(주) 단위로 밝아졌다 돌아오며 왼쪽에서 오른쪽으로 지나간다(D-65).
              같은 세로줄 4칸은 같은 시각에 같은 정도로. 마지막 줄이 끝나면 지운다 */}
          {weeks.map((w, i) => (
            <span
              key={w.start}
              title={`${formatKoreanDate(w.start)} 주 · ${w.count}번`}
              className={cn("aspect-square rounded-[2px]", wave && "belt-wave")}
              style={
                {
                  backgroundColor: WEEK_SHADES[Math.min(w.count, 5)],
                  "--week": WEEK_SHADES[Math.min(w.count, 5)],
                  animationDelay: wave ? `${250 + Math.floor(i / BELT_ROWS) * WAVE_STEP}ms` : undefined,
                } as CSSProperties
              }
              onAnimationEnd={i === weeks.length - 1 ? () => setWave(false) : undefined}
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
        <span className="text-[13px] font-medium text-muted-foreground tabular-nums">최근 2년 · {total}번</span>
      </div>

      {/* 벨트 설정 — 기술 고르기와 같은 떠 있는 팝업(T-35) */}
      <Dialog open={picking} onOpenChange={setPicking}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          style={{ ...floating, display: "flex", flexDirection: "column", gap: "14px", padding: "14px" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[17px] font-semibold">벨트 설정</DialogTitle>
            <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 rounded-full" onClick={() => setPicking(false)}>
              <X />
            </Button>
          </div>
          <DialogDescription className="sr-only">벨트 색과 수련을 시작한 연도 · 달을 바꿔요. 고르면 바로 저장돼요.</DialogDescription>
          <div className="flex flex-col gap-2">
            <span id="belt-setting-label" className="text-[15px] font-semibold">
              지금 벨트
            </span>
            <BeltChoice value={belt} onChange={choose} labelledBy="belt-setting-label" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold">주짓수를 시작한 때</span>
            <StartMonthPicker
              idPrefix="belt-start"
              value={startedOn ?? ""}
              thisMonth={thisMonth}
              onChange={(v) => v && changeStart(v)}
            />
            <p className="text-[13px] font-medium text-muted-foreground">
              {startedOn ? `${trainingSpan(startedOn, thisMonth)}로 보여요.` : "연도와 달을 고르면 바로 저장돼요."}
            </p>
          </div>
          <Button className="h-12 w-full rounded-full text-base shadow-none" onClick={() => setPicking(false)}>
            완료
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
