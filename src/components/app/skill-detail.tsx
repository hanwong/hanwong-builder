"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomAction } from "@/components/app/bottom-action";
import { LevelPicker } from "@/components/app/level-picker";
import { YoutubeLink } from "@/components/app/youtube-link";
import { SuggestEdit } from "@/components/app/suggest-edit";
import { PositionPicture } from "@/components/app/position-picture";
import { setLevel } from "@/app/app/skills/actions";
import { formatKoreanDate } from "@/lib/seoul-date";
import { MINE_LABEL, type Level } from "@/lib/mock/log-seed";
import type { SkillDetail as Detail } from "@/lib/skill-detail-data";

// 기술 상세 (T-10b, FLOW 4 · DESIGN 6) — 세팅 과정 · 내 숙련도(바꾸면 하단 "숙련도 저장", D-27) · 내 정리 모음.
export function SkillDetail({ skill }: { skill: Detail }) {
  const router = useRouter();
  const [saved, setSaved] = useState<Level | null>(skill.level); // DB 에 있는 값
  const [level, setLevelState] = useState<Level | null>(skill.level); // 지금 고른 값
  const [saving, startSaving] = useTransition();
  const dirty = level !== saved;

  // 바꾸면 하단에 "숙련도 저장"이 나타나고, 눌러야 저장 (D-27)
  function save() {
    if (!level || !dirty) return;
    startSaving(async () => {
      const res = await setLevel(skill.slug, level).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "저장 못 했어요 — 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      setSaved(level);
      toast.success("숙련도를 저장했어요");
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
        {/* 왼쪽 이름 · 오른쪽 포지션 그림(D-54) */}
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{skill.position}</Badge>
              {skill.mine ? (
                <Badge variant="outline">{MINE_LABEL[skill.mine]}</Badge>
              ) : (
                skill.draft && <Badge variant="outline">검수 전</Badge>
              )}
            </div>
            <h1 className="text-[24px] font-bold tracking-tight">
              <span className="mark-lime">{skill.nameKo}</span>
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground">
              {skill.nameEn}
              {skill.aliases.length > 0 && ` · 다른 이름: ${skill.aliases.join(", ")}`}
            </p>
          </div>
          <PositionPicture slug={skill.positionSlug} size={96} className="rounded-2xl" />
        </div>
      </header>

      {/* 세팅 과정 */}
      <Card className="rounded-2xl ring-border">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-semibold">세팅 과정</h2>
            {/* 좌우는 오른손잡이 기준으로 적는다(D-74) */}
            <span className="text-[12px] font-medium text-muted-foreground">오른손잡이 기준 · 왼손잡이는 좌우 반대로</span>
          </div>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed">
            {skill.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <YoutubeLink nameEn={skill.nameEn} />
          {/* 내가 만든 기술은 승인 때 운영자가 고친다 — 보완 제안은 공용 기술만 */}
          {!skill.mine && <SuggestEdit slug={skill.slug} steps={skill.steps} pending={skill.suggestionPending} />}
        </CardContent>
      </Card>

      {/* 내 숙련도 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[17px] font-semibold">내 숙련도</h2>
        <LevelPicker label={`${skill.nameKo} 숙련도`} value={level} onChange={setLevelState} disabled={saving} />
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
        {dirty ? (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-12 flex-1 rounded-full text-base shadow-none"
              disabled={saving}
              onClick={() => setLevelState(saved)}
            >
              되돌리기
            </Button>
            <Button className="h-12 flex-[2] rounded-full text-base shadow-none" disabled={saving} onClick={save}>
              {saving && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
              {saving ? "저장 중…" : "숙련도 저장"}
            </Button>
          </div>
        ) : (
          <Button asChild variant="secondary" className="h-12 w-full rounded-full text-base shadow-none">
            <Link href="/app/log">
              <Plus data-icon="inline-start" aria-hidden />
              이 기술 기록하기
            </Link>
          </Button>
        )}
      </BottomAction>
    </div>
  );
}
