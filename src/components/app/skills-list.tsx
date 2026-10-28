"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/lib/mock/log-seed";
import { HoverPrefetchLink } from "@/components/app/hover-prefetch-link";
import type { PositionGroup } from "@/lib/skills-data";
import { cn } from "@/lib/utils";
import { PositionPicture } from "@/components/app/position-picture";

const LEVEL_LABEL = new Map(LEVELS.map((l) => [l.value, l.label]));

// 내 기술 (T-10, FLOW 4 · DESIGN 6) — 포지션 아코디언(접힘) × 기술 + 숙련도 배지. 안 배운 건 흐리게.
export function SkillsList({ groups }: { groups: PositionGroup[] }) {
  const [onlyLearned, setOnlyLearned] = useState(false);
  const learnedTotal = groups.reduce((n, g) => n + g.skills.filter((s) => s.level).length, 0);

  const shown = groups
    .map((g) => ({ ...g, learned: g.skills.filter((s) => s.level).length }))
    .map((g) => (onlyLearned ? { ...g, skills: g.skills.filter((s) => s.level) } : g))
    .filter((g) => g.skills.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">내 기술</h1>
        <button
          type="button"
          aria-pressed={onlyLearned}
          onClick={() => setOnlyLearned((v) => !v)}
          className={cn(
            "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors",
            onlyLearned
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-foreground hover:bg-muted",
          )}
        >
          배운 것만 보기
        </button>
      </header>

      {learnedTotal === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-[15px] leading-relaxed text-muted-foreground">오늘 배운 것을 기록하면 여기 채워져요.</p>
          <Button asChild className="h-11 rounded-full px-5 text-[15px]">
            <Link href="/app/log">
              <Plus data-icon="inline-start" aria-hidden />
              오늘 배운 것 기록하기
            </Link>
          </Button>
        </div>
      ) : (
        <p className="text-[13px] font-medium text-muted-foreground tabular-nums">
          배운 기술 {learnedTotal}개 · 전체 {groups.reduce((n, g) => n + g.skills.length, 0)}개
        </p>
      )}

      {shown.length > 0 && (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          {shown.map((g) => (
            <details key={g.slug} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <PositionPicture slug={g.slug} size={44} className="rounded-lg" />
                <span className="text-[17px] font-semibold">{g.nameKo}</span>
                <span className="ml-auto text-[13px] font-medium text-muted-foreground tabular-nums">
                  {!onlyLearned && g.learned > 0 ? `${g.learned}개 배움 · ` : ""}
                  {g.skills.length}개
                </span>
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  strokeWidth={2}
                  aria-hidden
                />
              </summary>
              <ul className="flex flex-col pb-2">
                {g.skills.map((s) => (
                  <li key={s.slug} className="min-w-0">
                    {/* 누르면 기술 상세 (T-10b) */}
                    <HoverPrefetchLink
                      href={`/app/skills/${s.slug}`}
                      className={cn(
                        "flex min-w-0 items-center gap-2 px-4 py-2 transition-colors hover:bg-muted",
                        !s.level && "opacity-40",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-[15px]">{s.nameKo}</span>
                      {s.level && <Badge variant="secondary">{LEVEL_LABEL.get(s.level)}</Badge>}
                    </HoverPrefetchLink>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}

      {onlyLearned && learnedTotal === 0 && (
        <p className="text-[15px] text-muted-foreground">아직 배운 기술이 없어요.</p>
      )}
    </div>
  );
}
