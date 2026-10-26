"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ChevronDown, FlaskConical, Loader2, PencilLine, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BottomAction } from "@/components/app/bottom-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_BODY } from "@/lib/log-limits";
import { organizeLog } from "@/app/app/log/actions";
import { LEVELS, type Level, type MatchedTechnique, type Term } from "@/lib/mock/log-seed";

export type AiStatus = "ok" | "mock" | "none";

export type ReviewValue = {
  body: string;
  techniques: MatchedTechnique[];
  customNames: string[];
  terms: Term[];
  aiStatus: AiStatus;
};

type Props = {
  initial: ReviewValue & {
    loggedOn: string; // 화면 표시용 "10월 26일 (월)"
    skipped?: boolean; // 정리 실패 뒤 "그냥 저장" — 기술 없이 글만
  };
  onBack?: () => void;
  saveLabel?: string; // 새 기록 "저장", 저장한 기록 고치기 "고친 내용 저장"
  // 저장 — 성공하면 부모가 다음 화면으로 보낸다
  onSave: (value: ReviewValue) => Promise<void>;
};

// 정리 완료 화면(상태 C) — 새 기록(/app/log)과 저장한 기록 고치기(/app/log/[id], D-25)가 함께 쓴다.
// 글은 "글 고치기"로 그 자리에서 고치고, "다시 정리하기"를 누를 때만 기술 · 용어를 다시 찾는다(Claude 비용).
export function LogReview({ initial, onBack, saveLabel = "저장", onSave }: Props) {
  const [body, setBody] = useState(initial.body);
  const [editing, setEditing] = useState<string | null>(null); // 고치는 중인 글
  const [techniques, setTechniques] = useState(initial.techniques);
  const [customNames, setCustomNames] = useState<string[]>(initial.customNames);
  const [terms, setTerms] = useState(initial.terms);
  const [aiStatus, setAiStatus] = useState<AiStatus>(initial.aiStatus);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [organizing, startOrganizing] = useTransition();

  const setLevel = (id: string, level: Level) =>
    setTechniques((list) => list.map((t) => (t.id === id ? { ...t, level } : t)));
  const remove = (id: string) => setTechniques((list) => list.filter((t) => t.id !== id));

  const cardCount = techniques.length;
  const skipped = initial.skipped && aiStatus === "none";

  function finishEditing() {
    const text = editing?.trim();
    if (text) setBody(text);
    setEditing(null);
  }

  function reorganize() {
    const text = (editing ?? body).trim();
    if (!text) return;
    startOrganizing(async () => {
      const res = await organizeLog(text).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "정리하지 못했어요. 인터넷 연결을 확인해 주세요.");
        return;
      }
      // 이미 골라 둔 숙련도는 그대로 살린다
      const chosen = new Map(techniques.map((t) => [t.id, t.level]));
      setBody(text);
      setEditing(null);
      setTechniques(res.techniques.map((t) => ({ ...t, level: chosen.get(t.id) ?? t.level })));
      setTerms(res.terms);
      setAiStatus(res.isMock ? "mock" : "ok");
      toast.success("고친 글로 다시 정리했어요");
    });
  }

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

      {/* 내가 쓴 글 — 그 자리에서 고치기 (D-25) */}
      {editing === null ? (
        <Card className="rounded-2xl ring-border">
          <CardContent className="flex flex-col gap-2">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{body}</p>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 self-start rounded-full text-muted-foreground"
              onClick={() => setEditing(body)}
              disabled={organizing || saving}
            >
              <PencilLine data-icon="inline-start" aria-hidden />
              글 고치기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <Textarea
            autoFocus
            value={editing}
            onChange={(e) => setEditing(e.target.value.slice(0, MAX_BODY))}
            maxLength={MAX_BODY}
            aria-label="글 고치기"
            readOnly={organizing}
            className="min-h-40 resize-none rounded-2xl bg-card px-4 py-3 text-base leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="h-10 rounded-full"
              onClick={finishEditing}
              disabled={organizing || !editing.trim()}
            >
              글만 바꾸기
            </Button>
            <Button className="h-10 rounded-full" onClick={reorganize} disabled={organizing || !editing.trim()}>
              {organizing ? (
                <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
              ) : (
                <Sparkles data-icon="inline-start" aria-hidden />
              )}
              {organizing ? "정리 중…" : "다시 정리하기"}
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-full text-muted-foreground"
              onClick={() => setEditing(null)}
              disabled={organizing}
            >
              취소
            </Button>
          </div>
          <p className="text-[13px] font-medium text-muted-foreground">
            "다시 정리하기"는 고친 글에서 기술을 새로 찾아요. 정한 숙련도는 그대로 둬요.
          </p>
        </div>
      )}

      {/* 언급된 기술 */}
      <section className={cn("flex flex-col gap-3", organizing && "opacity-50")}>
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold">언급된 기술</h2>
          {aiStatus === "mock" && (
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
            {skipped
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

        {nameDraft === null ? (
          <button
            type="button"
            onClick={() => setNameDraft("")}
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
              const name = nameDraft.trim();
              if (name && !customNames.includes(name)) setCustomNames((l) => [...l, name]);
              setNameDraft(null);
            }}
          >
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="기술 이름 (예: 베림볼로)"
              className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="submit" variant="secondary" className="h-12 rounded-full px-4">
              추가
            </Button>
          </form>
        )}
      </section>

      {/* 용어 */}
      {terms.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold">용어</h2>
          <Card className="rounded-2xl ring-border">
            <CardContent>
              <dl className="flex flex-col gap-2.5">
                {terms.map(({ term, meaning }) => (
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

      <BottomAction>
        <Button
          className="h-12 w-full rounded-full text-base shadow-none"
          disabled={saving || organizing}
          onClick={() =>
            startSaving(() => {
              // 고치는 중인 글 · 이름 칸에 적고 안 누른 것도 저장에 넣는다
              const text = editing?.trim() || body;
              const typed = nameDraft?.trim();
              return onSave({
                body: text,
                techniques,
                customNames: typed && !customNames.includes(typed) ? [...customNames, typed] : customNames,
                terms,
                aiStatus,
              });
            })
          }
        >
          {saving && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
          {saving ? "저장 중…" : saveLabel}
        </Button>
      </BottomAction>
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
