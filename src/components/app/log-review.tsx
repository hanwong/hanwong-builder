"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown, FlaskConical, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LEVELS, type Level, type MatchedTechnique, type Term } from "@/lib/mock/log-seed";

type Props = {
  initial: {
    loggedOn: string;
    body: string;
    isMock: boolean;
    techniques: MatchedTechnique[];
    terms: Term[];
    skipped?: boolean; // 정리 실패 뒤 "그냥 저장" — 기술 없이 글만
  };
  onBack?: () => void;
};

// 오늘 배운 것 기록 — 상태 C(확인). FLOW.md 5 배치도 그대로.
export function LogReview({ initial, onBack }: Props) {
  const [techniques, setTechniques] = useState(initial.techniques);
  const [customNames, setCustomNames] = useState<string[]>([]);
  const [draft, setDraft] = useState<string | null>(null);

  const setLevel = (id: string, level: Level) =>
    setTechniques((list) => list.map((t) => (t.id === id ? { ...t, level } : t)));
  const remove = (id: string) => setTechniques((list) => list.filter((t) => t.id !== id));

  const cardCount = techniques.length;

  return (
    <div className="flex flex-col gap-5">
      {/* 제목 줄 */}
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="뒤로" className="-ml-2 rounded-full" onClick={onBack}>
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Button>
        <h1 className="text-[22px] font-bold tracking-tight">오늘 배운 것</h1>
        <span className="ml-auto text-[13px] font-medium text-muted-foreground">
          {initial.loggedOn}
        </span>
      </header>

      {/* 내가 쓴 글 (읽기) */}
      <Card className="rounded-2xl ring-border">
        <CardContent className="text-[15px] leading-relaxed">{initial.body}</CardContent>
      </Card>

      {/* 언급된 기술 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold">언급된 기술</h2>
          {initial.isMock && (
            <Badge variant="secondary">
              <FlaskConical data-icon="inline-start" aria-hidden />
              연습용 예시
            </Badge>
          )}
          <span className="ml-auto text-[13px] font-medium text-muted-foreground tabular-nums">
            {cardCount}개
          </span>
        </div>

        {techniques.length === 0 && customNames.length === 0 && (
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {initial.skipped
              ? "정리 없이 글만 저장해요. 배운 기술 이름을 알면 아래에 직접 적어도 돼요."
              : "글에서 목록에 있는 기술을 찾지 못했어요. 아래에서 이름을 직접 적어 주세요."}
          </p>
        )}

        {techniques.some((t) => t.guess) && (
          <p className="text-[13px] leading-relaxed font-medium text-muted-foreground">
            글에 포지션이 없어 포지션별로 추측한 기술도 넣었어요. 아닌 건 빼 주세요.
          </p>
        )}

        {techniques.map((t) => (
          <TechniqueCard key={t.id} technique={t} onLevel={setLevel} onRemove={remove} />
        ))}

        {customNames.map((name) => (
          <Card key={name} className="rounded-2xl ring-border" size="sm">
            <CardContent className="flex items-center gap-2">
              <span className="text-[17px] font-semibold">{name}</span>
              <Badge variant="outline">미검수</Badge>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${name} 빼기`}
                className="ml-auto rounded-full text-muted-foreground"
                onClick={() => setCustomNames((l) => l.filter((n) => n !== name))}
              >
                <X />
              </Button>
            </CardContent>
          </Card>
        ))}

        {draft === null ? (
          <button
            type="button"
            onClick={() => setDraft("")}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            목록에 없는 기술 적기
          </button>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = draft.trim();
              if (name) setCustomNames((l) => [...l, name]);
              setDraft(null);
            }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="기술 이름 (예: 베림볼로)"
              className="h-12 flex-1 rounded-xl border border-input bg-card px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="secondary" className="h-12 rounded-full px-4">
              추가
            </Button>
          </form>
        )}
      </section>

      {/* 용어 */}
      {initial.terms.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold">용어</h2>
          <Card className="rounded-2xl ring-border">
            <CardContent>
              <dl className="flex flex-col gap-2.5">
                {initial.terms.map(({ term, meaning }) => (
                  <div key={term} className="flex gap-3 text-[15px] leading-relaxed">
                    <dt className="shrink-0 font-semibold">{term}</dt>
                    <dd className="text-muted-foreground">{meaning}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 고정 저장 버튼 자리 확보 */}
      <div className="h-16" aria-hidden />

      {/* 저장 — 하단 탭 위에 고정 */}
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-10 px-4">
        <div className="mx-auto max-w-md">
          <Button
            className="h-12 w-full rounded-full text-base shadow-none"
            // 실제 저장 · 복습 카드 만들기는 T-08. 그 전까지는 저장됐다고 말하지 않는다.
            onClick={() => toast("아직 저장되지 않아요. 저장은 다음 단계(T-08)에서 연결돼요.")}
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}

function TechniqueCard({
  technique: t,
  onLevel,
  onRemove,
}: {
  technique: MatchedTechnique;
  onLevel: (id: string, level: Level) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="rounded-2xl ring-border">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[17px] font-semibold">
              <span className="mark-lime">{t.nameKo}</span>
            </span>
            <span className="text-[13px] font-medium text-muted-foreground">
              {t.nameEn} · {t.position}
            </span>
            {(t.guess || t.draft) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {t.guess && <Badge variant="secondary">추측</Badge>}
                {t.draft && <Badge variant="outline">검수 전</Badge>}
                {t.guess && (
                  <span className="text-[13px] font-medium text-foreground">{t.position}에서 배웠다면</span>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto -mr-2 rounded-full text-muted-foreground"
            onClick={() => onRemove(t.id)}
          >
            <X data-icon="inline-start" />
            빼기
          </Button>
        </div>

        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 self-start text-[15px] font-medium"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
            strokeWidth={2}
            aria-hidden
          />
          세팅 과정 {t.steps.length}줄
        </button>
        {open && (
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
            {t.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-muted-foreground">내 숙련도</span>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${t.nameKo} 숙련도`}>
            {LEVELS.map((lv) => {
              const selected = lv.value === t.level;
              return (
                <button
                  key={lv.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onLevel(t.id, lv.value)}
                  className={cn(
                    "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors",
                    selected
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {lv.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
