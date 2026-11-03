import { Swords } from "lucide-react";

// 홈 스파링 칸(D-64, 그래픽 D-116) — 이번 달 판 수를 벨트 테이프 줄(스트라이프)처럼 그린다. 최대 12줄, 넘치면 "+N".
const MAX_STRIPES = 12;

export function SparringTile({ month, total }: { month: number; total: number }) {
  const shown = Math.min(month, MAX_STRIPES);
  return (
    <section
      className="flex items-center gap-4 rounded-2xl bg-card px-4 py-3 ring-1 ring-border"
      aria-label={`스파링 이번 달 ${month}판, 전체 ${total}판`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          <Swords className="size-4" strokeWidth={1.75} aria-hidden />
          스파링
        </span>
        <p className="flex items-baseline gap-1 tabular-nums">
          <span className="text-[28px] leading-none font-bold">{month}</span>
          <span className="text-[13px] font-medium text-muted-foreground">판 · 이번 달</span>
        </p>
        {/* 검정 띠 위에 라임 테이프 — 판마다 한 줄 */}
        <div className="flex h-5 items-center gap-[3px] rounded-full bg-foreground px-2.5" aria-hidden>
          {Array.from({ length: shown }, (_, i) => (
            <span key={i} className="h-3 w-1.5 rounded-[1px] bg-accent" />
          ))}
          {month > MAX_STRIPES && <span className="ml-1 text-[11px] font-bold text-accent">+{month - MAX_STRIPES}</span>}
          {month === 0 && <span className="text-[11px] font-medium text-background/70">이번 달 첫 판을 기다려요</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end tabular-nums">
        <span className="text-[12px] font-medium text-muted-foreground">전체</span>
        <span className="text-[20px] leading-tight font-semibold">{total}판</span>
      </div>
    </section>
  );
}
