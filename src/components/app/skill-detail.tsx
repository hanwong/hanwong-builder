"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomAction } from "@/components/app/bottom-action";
import { LevelPicker } from "@/components/app/level-picker";
import { setLevel } from "@/app/app/skills/actions";
import { formatKoreanDate } from "@/lib/seoul-date";
import type { Level } from "@/lib/mock/log-seed";
import type { SkillDetail as Detail } from "@/lib/skill-detail-data";

// 기술 상세 (T-10b, FLOW 4 · DESIGN 6) — 세팅 과정 · 내 숙련도(누르면 바로 저장) · 복습 상태 · 내 정리 모음.
export function SkillDetail({ skill }: { skill: Detail }) {
  const router = useRouter();
  const [level, setLevelState] = useState<Level | null>(skill.level);
  const [saving, startSaving] = useTransition();

  function changeLevel(next: Level) {
    if (next === level) return;
    const prev = level;
    setLevelState(next); // 먼저 바꿔 보여 주고, 실패하면 되돌린다
    startSaving(async () => {
      const res = await setLevel(skill.slug, next).catch(() => null);
      if (!res || !res.ok) {
        setLevelState(prev);
        toast.error(res?.message ?? "저장 못 했어요 — 인터넷 연결을 확인하고 다시 눌러 주세요.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="뒤로"
          className="-ml-2 rounded-full"
          onClick={() => router.push("/app/skills")}
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Button>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{skill.position}</Badge>
          {skill.draft && <Badge variant="outline">검수 전</Badge>}
        </div>
        <h1 className="text-[24px] font-bold tracking-tight">
          <span className="mark-lime">{skill.nameKo}</span>
        </h1>
        <p className="text-[13px] font-medium text-muted-foreground">
          {skill.nameEn}
          {skill.aliases.length > 0 && ` · 다른 이름: ${skill.aliases.join(", ")}`}
        </p>
      </header>

      {/* 세팅 과정 */}
      <Card className="rounded-2xl ring-border">
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold">세팅 과정</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed">
            {skill.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* 내 숙련도 · 복습 상태 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[17px] font-semibold">내 숙련도</h2>
        <LevelPicker label={`${skill.nameKo} 숙련도`} value={level} onChange={changeLevel} disabled={saving} />
        <p className="text-[13px] font-medium text-muted-foreground">
          {skill.card
            ? `다음 복습 ${formatKoreanDate(skill.card.dueOn)} · 지금까지 ${skill.card.reviews}번 복습`
            : "아직 복습 카드가 없어요. 기록에서 이 기술을 저장하면 생겨요."}
        </p>
      </section>

      {/* 내 정리 모음 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold">
          내 정리 모음 <span className="text-muted-foreground tabular-nums">{skill.logs.length}</span>
        </h2>
        {skill.logs.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">아직 이 기술을 정리한 적이 없어요.</p>
        ) : (
          skill.logs.map((log) => (
            <Link key={log.id} href={`/app/log/${log.id}`} className="block">
              <Card className="rounded-2xl ring-border transition-colors hover:bg-muted" size="sm">
                <CardContent className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[13px] font-medium text-muted-foreground">
                      {formatKoreanDate(log.loggedOn)}
                    </span>
                    <p className="line-clamp-3 text-[15px] leading-relaxed whitespace-pre-wrap">{log.body}</p>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </section>

      <BottomAction>
        <Button asChild variant="secondary" className="h-12 w-full rounded-full text-base shadow-none">
          <Link href="/app/log">
            <Plus data-icon="inline-start" aria-hidden />
            이 기술 기록하기
          </Link>
        </Button>
      </BottomAction>
    </div>
  );
}
