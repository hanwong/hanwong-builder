import Link from "next/link";
import { ArrowRight, MapPlus, MessageCircleQuestion, MoonStar, Sprout } from "lucide-react";
import { PositionPicture } from "@/components/app/position-picture";
import type { Growth } from "@/lib/ask/ask-data"; // 타입만 — server-only 모듈이어도 지워진다

// 질문할수록 자라는 기술 지도(D-115) — 글 대신 그림 · 숫자. map_growth 에서(공용 기술 · 에이전트 실행 기록의 숫자만)
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export function GrowingMap({ growth, myCount, today }: { growth: Growth; myCount: number; today: string }) {
  const run = growth.lastRun;
  const week = growth.daily.slice(-7);
  const max = Math.max(1, ...week);
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  return (
    <section className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-3xl bg-foreground p-5 text-background">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold opacity-80">
          <Sprout className="size-4" strokeWidth={2} aria-hidden />
          질문으로 자라는 기술 지도
        </span>
        {growth.added7d > 0 && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-bold text-accent-foreground tabular-nums">
            7일 +{growth.added7d}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <p className="flex flex-col tabular-nums">
          <span className="text-[44px] leading-none font-bold tracking-tight">{growth.total}</span>
          <span className="mt-1 text-[13px] opacity-70">기술</span>
        </p>
        {/* 최근 7일 날마다 들어간 기술 — 막대 */}
        <div className="flex h-16 items-end gap-1.5" aria-label={`최근 7일 날마다 들어간 기술: ${week.join(", ")}`}>
          {week.map((n, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={i === week.length - 1 ? "w-4 rounded-sm bg-accent" : "w-4 rounded-sm bg-background/35"}
                style={{ height: `${Math.max(3, (n / max) * 44)}px` }}
              />
              <span className="text-[10px] opacity-60">{WEEKDAY[(dow - (week.length - 1 - i) + 14) % 7]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 고리: 질문 → 밤사이 분석 → 지도에 추가 */}
      <ol className="grid grid-cols-3 gap-2 text-center" aria-label="질문이 지도가 되는 순서">
        {LOOP.map(({ Icon, label }, i) => (
          <li key={label} className="relative flex flex-col items-center gap-1.5">
            <span className="flex size-11 items-center justify-center rounded-full bg-background/10">
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="text-[12px] font-medium opacity-90">{label}</span>
            {i < LOOP.length - 1 && (
              <ArrowRight className="absolute top-3.5 -right-2 size-4 opacity-50" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      {run && (
        <div className="grid grid-cols-3 gap-2 tabular-nums">
          <Stat value={run.questions} label="어젯밤 본 질문" />
          <Stat value={run.drafted} label="만든 초안" />
          <Stat value={myCount} label="내 질문" />
        </div>
      )}

      {growth.recent.length > 0 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {growth.recent.map((t) => (
            <Link
              key={t.slug}
              href={`/app/skills/${t.slug}`}
              className="flex w-28 shrink-0 flex-col gap-1.5 rounded-2xl bg-background p-2 text-foreground"
            >
              <PositionPicture slug={t.position} size={96} className="size-24 self-center" />
              <span className="line-clamp-2 text-[12px] leading-snug font-medium">{t.name}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

const LOOP = [
  { Icon: MessageCircleQuestion, label: "내 질문" },
  { Icon: MoonStar, label: "밤사이 분석" },
  { Icon: MapPlus, label: "지도에 추가" },
];

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-background/10 py-2.5">
      <span className="text-[22px] leading-none font-bold">{value}</span>
      <span className="mt-1 text-[11px] opacity-70">{label}</span>
    </div>
  );
}
