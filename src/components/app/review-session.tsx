"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Layers, Loader2, Plus, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomAction } from "@/components/app/bottom-action";
import { answerCard } from "@/app/app/review/actions";
import { formatKoreanDate } from "@/lib/seoul-date";
import { INTERVAL_DAYS, RATINGS, nextStep, type Rating } from "@/lib/review-rules";
import type { DueCard } from "@/lib/review-data";
import { cn } from "@/lib/utils";

// 오늘 복습 (T-09, FLOW 4 · DESIGN 6) — 앞면(이름 · 포지션) → 뒤집기 → 뒷면(세팅 과정 · 내 최근 기록) → 4단계 답.
export function ReviewSession({ cards, laterDue }: { cards: DueCard[]; laterDue: string | null }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dues, setDues] = useState<string[]>([]); // 답한 카드들의 다음 복습일
  const [pending, startAnswer] = useTransition();

  if (cards.length === 0) {
    return (
      <EmptyState
        title="오늘 복습할 카드가 없어요"
        line={laterDue ? `다음 복습은 ${formatKoreanDate(laterDue)}이에요.` : "오늘 배운 걸 기록하면 내일부터 물어볼게요."}
      />
    );
  }

  if (index >= cards.length) {
    const next = [...dues, ...(laterDue ? [laterDue] : [])].sort()[0];
    return (
      <EmptyState
        title="오늘 복습 끝 🥋"
        line={next ? `다음 복습은 ${formatKoreanDate(next)}이에요.` : "수고했어요."}
        home
      />
    );
  }

  const card = cards[index];

  function answer(rating: Rating) {
    startAnswer(async () => {
      const res = await answerCard(card.id, rating).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "저장 못 했어요 — 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      setDues((d) => [...d, res.dueOn]);
      setFlipped(false);
      setIndex((i) => i + 1);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 진행 */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold tracking-tight">오늘 복습</h1>
          <span className="text-[15px] font-semibold tabular-nums">
            {index + 1} / {cards.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-foreground transition-[width]"
            style={{ width: `${(index / cards.length) * 100}%` }}
          />
        </div>
      </header>

      {/* 카드 */}
      <Card className="min-h-[60vh] rounded-2xl ring-border">
        <CardContent className={cn("flex flex-1 flex-col gap-4", !flipped && "items-center justify-center text-center")}>
          <div className={cn("flex flex-col gap-1", !flipped && "items-center")}>
            <span className="text-[13px] font-medium text-muted-foreground">{card.position}</span>
            <h2 className="text-[24px] font-bold tracking-tight">
              <span className="mark-lime">{card.nameKo}</span>
            </h2>
            <span className="text-[13px] font-medium text-muted-foreground">{card.nameEn}</span>
            {card.draft && (
              <Badge variant="outline" className={cn("mt-1", !flipped && "self-center")}>
                검수 전
              </Badge>
            )}
          </div>

          {!flipped ? (
            <p className="text-[15px] leading-relaxed text-muted-foreground">세팅 순서를 떠올려 보세요.</p>
          ) : (
            <>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed">
                {card.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {card.lastNote && (
                <div className="mt-auto rounded-xl bg-muted px-3 py-2.5">
                  <span className="text-[12px] font-medium text-muted-foreground">
                    내 기록 · {formatKoreanDate(card.lastNote.loggedOn)}
                  </span>
                  <p className="text-[14px] leading-relaxed">{card.lastNote.text}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <BottomAction>
        {!flipped ? (
          <Button className="h-12 w-full rounded-full text-base shadow-none" onClick={() => setFlipped(true)}>
            <RotateCw data-icon="inline-start" aria-hidden />
            뒤집기
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map(({ value, label }) => (
              <Button
                key={value}
                variant={value === "again" ? "outline" : "secondary"}
                disabled={pending}
                onClick={() => answer(value)}
                className={cn(
                  "flex h-14 flex-col gap-0 rounded-2xl text-[15px] shadow-none",
                  value === "again" && "border-destructive/40 bg-card text-destructive hover:text-destructive",
                )}
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : label}
                <span className="text-[11px] font-medium opacity-70">{INTERVAL_DAYS[nextStep(card.step, value)]}일 뒤</span>
              </Button>
            ))}
          </div>
        )}
      </BottomAction>
    </div>
  );
}

// 카드 없음 · 끝 화면 — 아이콘 하나 + 한 줄 + 버튼 하나 (DESIGN 4)
function EmptyState({ title, line, home = false }: { title: string; line: string; home?: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <Layers className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <h1 className="text-[20px] font-bold tracking-tight">{title}</h1>
      <p className="text-[15px] text-muted-foreground">{line}</p>
      <Button asChild className="mt-2 h-12 rounded-full px-6 text-base">
        {home ? (
          <Link href="/app">홈으로</Link>
        ) : (
          <Link href="/app/log">
            <Plus data-icon="inline-start" aria-hidden />
            오늘 배운 것 기록하기
          </Link>
        )}
      </Button>
    </div>
  );
}
