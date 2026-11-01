"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverPrefetchLink } from "@/components/app/hover-prefetch-link";
import { YoutubeLink } from "@/components/app/youtube-link";
import type { Drill } from "@/lib/drills-data";
import { AI_NOTICE } from "@/lib/ai-notice";

// 드릴 (D-112, FLOW `/app/drills/[slug]`) — 한 줄 설명 → 하는 법 → 노하우 → 필요한 이유 → 이어지는 기술.
export function DrillDetail({ drill }: { drill: Drill }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="뒤로"
          className="-ml-2 rounded-full"
          onClick={() => (history.length > 1 ? router.back() : router.push("/app/skills"))}
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Button>
        <Badge variant="secondary" className="self-start">
          기본 드릴
        </Badge>
        <h1 className="text-[24px] font-bold tracking-tight">
          <span className="mark-lime">{drill.nameKo}</span>
        </h1>
        <p className="text-[13px] font-medium text-muted-foreground">
          {drill.nameEn}
          {drill.aliases.length > 0 && ` · 다른 이름: ${drill.aliases.join(", ")}`}
        </p>
        <p className="text-[15px] leading-relaxed">{drill.summary}</p>
      </header>

      <Card className="rounded-2xl ring-border">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-semibold">하는 법</h2>
            <span className="text-[12px] font-medium text-muted-foreground">
              오른손잡이 기준 · 양쪽 번갈아
            </span>
          </div>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed">
            {drill.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <YoutubeLink nameEn={`${drill.nameEn} drill`} />
        </CardContent>
      </Card>

      <Bullets title="노하우" lines={drill.tips} />
      <Bullets title="이 드릴이 필요한 이유" lines={drill.why} />

      {drill.related.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[17px] font-semibold">이어지는 기술</h2>
          <ul className="flex flex-col overflow-hidden rounded-2xl bg-card py-1 ring-1 ring-border">
            {drill.related.map((t) => (
              <li key={t.slug} className="min-w-0">
                <HoverPrefetchLink
                  href={`/app/skills/${t.slug}`}
                  className="flex min-w-0 items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px]">{t.nameKo}</span>
                    {t.position && <span className="truncate text-[12px] text-muted-foreground">{t.position}</span>}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </HoverPrefetchLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 사람 검증 전이라는 안내(D-86) */}
      <p className="text-[12px] leading-relaxed text-muted-foreground">{AI_NOTICE}</p>
    </div>
  );
}

function Bullets({ title, lines }: { title: string; lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <Card className="rounded-2xl ring-border">
      <CardContent className="flex flex-col gap-2">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
