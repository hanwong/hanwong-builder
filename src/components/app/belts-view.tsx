"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Circle, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverPrefetchLink } from "@/components/app/hover-prefetch-link";
import { PositionPicture } from "@/components/app/position-picture";
import { BeltDot } from "@/components/app/belt-dot";
import { DrillChips } from "@/components/app/drill-chips";
import type { DrillChip } from "@/lib/drills-data";
import { LEVELS } from "@/lib/mock/log-seed";
import type { AdultBelt, BeltList } from "@/lib/belt-techniques-data";
import { cn } from "@/lib/utils";

const LEVEL_LABEL = new Map(LEVELS.map((l) => [l.value, l.label]));

// 벨트별 기술 (D-126, FLOW · DESIGN '벨트별 기술') — 벨트 탭 5개(처음엔 내 벨트) → 포지션별 목록 → ✓ · N번 · 숙련도.
// 앱이 "익혔다"를 판정하지 않는다 — ✓ 는 "내 기록에 적어 봤다"는 사실뿐.
export function BeltsView({ myBelt, belts, drills }: { myBelt: AdultBelt; belts: BeltList[]; drills: DrillChip[] }) {
  const router = useRouter(); // 뒤로: 들어온 화면(홈 카드, D-142), 없으면 홈
  const [belt, setBelt] = useState<AdultBelt>(myBelt);
  const list = belts.find((b) => b.belt === belt) ?? belts[0];
  const pct = list.total ? Math.round((list.learned / list.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="icon" aria-label="뒤로" className="-ml-2 rounded-full" onClick={() => (window.history.length > 1 ? router.back() : router.push("/app"))}>
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Button>
        <h1 className="text-[22px] font-bold tracking-tight">벨트별 기술</h1>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          벨트마다 흔히 배우는 기술이에요. 체육관마다 달라요 · 사람이 검증하지 않은 목록이에요.
        </p>
      </header>

      {/* 벨트 탭 — '배운 것만 보기'와 같은 알약, 한 줄 가로 넘김 */}
      <div role="tablist" aria-label="벨트" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {belts.map((b) => {
          const on = b.belt === belt;
          return (
            <button
              key={b.belt}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setBelt(b.belt)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              <BeltDot color={b.color} belt={b.belt} className="size-3" />
              {b.label}
              {b.belt === myBelt && <span className={cn("text-[11px]", on ? "text-background/70" : "text-muted-foreground")}>내 벨트</span>}
            </button>
          );
        })}
      </div>

      {/* 기본 드릴(D-112) — 화이트 벨트 기술 위에만(D-140) */}
      {belt === "white" && <DrillChips drills={drills} wrap />}

      {/* 진행도 — 적어 본 기술 수 / 목록 수 */}
      <section className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[15px] font-semibold">
            <span className="tabular-nums">
              {list.learned}/{list.total}
            </span>
          </p>
          <p className="text-[13px] text-muted-foreground">{list.learned === 0 ? "기록하면 ✓ 가 붙어요" : `${pct}%`}</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="적어 본 기술 비율">
          <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        {list.groups.map((g) => (
          <section key={g.slug} aria-label={g.nameKo}>
            <div className="flex items-center gap-3 px-4 pb-1 pt-3">
              <PositionPicture slug={g.slug} size={28} className="rounded-md" />
              <h2 className="text-[17px] font-semibold">{g.nameKo}</h2>
              <span className="ml-auto text-[13px] font-medium text-muted-foreground tabular-nums">
                {g.skills.filter((s) => s.learned).length}/{g.skills.length}
              </span>
            </div>
            <ul className="flex flex-col pb-2">
              {g.skills.map((s) => (
                <li key={s.slug} className="min-w-0">
                  <HoverPrefetchLink
                    href={`/app/skills/${s.slug}`}
                    className="flex min-w-0 items-center gap-2.5 px-4 py-2 transition-colors hover:bg-muted"
                  >
                    {s.learned ? (
                      <CircleCheck className="size-5 shrink-0 fill-accent text-foreground" strokeWidth={1.75} aria-label="적어 봤음" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/50" strokeWidth={1.5} aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate text-[15px]">{s.nameKo}</span>
                    {s.count > 0 && <span className="text-[13px] text-muted-foreground tabular-nums">{s.count}번</span>}
                    {s.level && <Badge variant="secondary">{LEVEL_LABEL.get(s.level)}</Badge>}
                  </HoverPrefetchLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
