"use client";

import { useState, useTransition, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { ArrowLeft, ChevronDown, Loader2, Mic, MicOff, Minus, PencilLine, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BottomAction } from "@/components/app/bottom-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { MAX_BODY } from "@/lib/log-limits";
import { useSpeechInput } from "@/lib/use-speech-input";
import { LevelPicker } from "@/components/app/level-picker";
import { TechniquePicker } from "@/components/app/technique-picker";
import { YoutubeLink } from "@/components/app/youtube-link";
import { PositionPicture } from "@/components/app/position-picture";
import { createOwnTechnique, generateTechnique, techniquePositions, type GenerateResult } from "@/app/app/log/actions";
import { forgetPicker } from "@/lib/picker-store";
import { MINE_LABEL, type Level, type MatchedTechnique, type Term } from "@/lib/mock/log-seed";
import { AI_NOTICE } from "@/lib/ai-notice";

export type AiStatus = "ok" | "mock" | "none";

export type ReviewValue = {
  body: string;
  techniques: MatchedTechnique[];
  customNames: string[];
  terms: Term[];
  aiStatus: AiStatus;
  sparringRounds: number; // 스파링 몇 판(D-64)
};

type Props = {
  initial: ReviewValue & {
    loggedOn: string; // 화면 표시용 "10월 26일 (월)"
  };
  date?: ReactNode; // 새 기록 — 날짜 고르기. 없으면 loggedOn 글자
  youtube?: boolean; // 기술 카드의 유튜브 버튼 — 새 기록 입력 중엔 뺀다(본인 요청)
  onBack?: () => void;
  saveLabel?: string; // 새 기록 "저장", 저장한 기록 고치기 "고친 내용 저장"
  // 저장 — 성공하면 부모가 다음 화면으로 보낸다
  onSave: (value: ReviewValue) => Promise<void>;
  // 저장한 기록만 — 지우기 (D-26). 한 번 더 확인한 뒤 부른다
  onDelete?: () => Promise<void>;
  // 저장한 기록만 — 제목 줄 오른쪽 끝(공유, D-51)
  headerAction?: ReactNode;
};

// 기록 화면(D-56) — 새 기록(/app/log)과 저장한 기록 보기 · 고치기(/app/log/[id], D-25)가 함께 쓴다.
// 배운 기술을 먼저 고르고(포지션 그림 · 검색) 오늘 메모는 한 칸(선택). 기술이나 메모 중 하나는 있어야 저장.
export function LogReview({ initial, date, youtube = true, onBack, saveLabel = "저장", onSave, onDelete, headerAction }: Props) {
  const [body, setBody] = useState(initial.body);
  const [techniques, setTechniques] = useState(initial.techniques);
  const [customNames, setCustomNames] = useState<string[]>(initial.customNames);
  const [sparring, setSparring] = useState(initial.sparringRounds);
  const [saving, startSaving] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDeleting] = useTransition();

  const setLevel = (id: string, level: Level) =>
    setTechniques((list) => list.map((t) => (t.id === id ? { ...t, level } : t)));
  const remove = (id: string) => setTechniques((list) => list.filter((t) => t.id !== id));
  // 기술 카드 만들기(D-57) — 직접 적은 이름을 AI 기술 카드로 바꾼다(나만 보기, 운영자 승인 뒤 공용).
  // AI 가 만들지 못하면 그 카드 아래에 포지션 · 이름 · 세팅 과정을 직접 적는 칸을 연다(2026-10-31 본인 요청)
  const [generating, setGenerating] = useState<string | null>(null);
  const [manual, setManual] = useState<Record<string, { slug: string; nameKo: string }[]>>({});
  async function generate(name: string) {
    setGenerating(name);
    const res = await generateTechnique(name).catch(() => null);
    setGenerating(null);
    if (!res || !res.ok) {
      toast.error(res?.message ?? "만들지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      const positions = res && !res.ok ? res.positions : undefined;
      if (positions?.length) setManual((m) => ({ ...m, [name]: positions }));
      return;
    }
    created(name, res);
  }
  // 직접 만들기 — AI 를 부르지 않고 바로 적는 칸을 연다(2026-10-31 본인 요청)
  async function writeOwn(name: string) {
    if (manual[name]) return;
    setGenerating(name);
    const positions = await techniquePositions().catch(() => []);
    setGenerating(null);
    if (!positions.length) {
      toast.error("포지션 목록을 받지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      return;
    }
    setManual((m) => ({ ...m, [name]: positions }));
  }
  function created(name: string, res: Extract<GenerateResult, { ok: true }>) {
    setManual((m) => withoutKey(m, name));
    const t = res.technique;
    if (res.kind === "new") forgetPicker(); // 새 내 기술 — 다음 고르기 · 검색에 보이게 새로 받는다
    setCustomNames((l) => l.filter((n) => n !== name));
    setTechniques((list) => (list.some((x) => x.id === t.id) ? list : [...list, t]));
    const left = res.left >= 0 ? ` · 오늘 ${res.left}번 남음` : "";
    toast.success(
      res.kind === "new"
        ? `‘${t.nameKo}’ 카드를 만들었어요. 관리자 승인 전까지 나에게만 보여요${left}`
        : `이미 목록에 있는 ‘${t.nameKo}’(으)로 바꿨어요${left}`,
    );
  }
  const toggle = (t: MatchedTechnique) =>
    setTechniques((list) => (list.some((x) => x.id === t.id) ? list.filter((x) => x.id !== t.id) : [...list, t]));

  const count = techniques.length + customNames.length;
  const canSave = count > 0 || sparring > 0 || body.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* 제목 줄 */}
      <header className="flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="icon" aria-label="뒤로" className="-ml-2 rounded-full" onClick={onBack}>
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </Button>
        )}
        <h1 className="text-[22px] font-bold tracking-tight">오늘 배운 것</h1>
        <span className="ml-auto text-[13px] font-medium text-muted-foreground">{date ?? initial.loggedOn}</span>
        {headerAction}
      </header>

      {/* 배운 기술 — 먼저 고른다 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold">배운 기술</h2>
          {count > 0 && (
            <span className="ml-auto text-[13px] font-medium text-muted-foreground tabular-nums">{count}개</span>
          )}
        </div>

        {techniques.map((t) => (
          <TechniqueCard key={t.id} technique={t} youtube={youtube} onLevel={setLevel} onRemove={remove} />
        ))}

        {customNames.map((name) => (
          <Card key={name} className="rounded-2xl ring-border" size="sm">
            <CardContent className="flex flex-wrap items-center gap-2">
              {/* 첫 줄: 이름 · 빼기 / 둘째 줄: '기술 카드 생성' — AI로 만들기 · 직접 만들기 (2026-10-31 본인 요청) */}
              <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${name} 빼기`}
                className="rounded-full text-muted-foreground"
                onClick={() => {
                  setCustomNames((l) => l.filter((n) => n !== name));
                  setManual((m) => withoutKey(m, name));
                }}
              >
                <X />
              </Button>
              <p className="w-full text-[13px] font-semibold text-muted-foreground">기술 카드 생성</p>
              <div className="flex w-full flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full shadow-none"
                  disabled={generating !== null || saving}
                  onClick={() => generate(name)}
                >
                  {generating === name ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
                  ) : (
                    <Sparkles data-icon="inline-start" aria-hidden />
                  )}
                  {generating === name ? "만드는 중…" : "AI로 만들기"}
                </Button>
                {!manual[name] && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full shadow-none"
                    disabled={generating !== null || saving}
                    onClick={() => writeOwn(name)}
                  >
                    <PencilLine data-icon="inline-start" aria-hidden />
                    직접 만들기
                  </Button>
                )}
              </div>
              {manual[name] && (
                <ManualTechniqueForm
                  name={name}
                  positions={manual[name]}
                  disabled={saving}
                  onCreated={(res) => created(name, res)}
                />
              )}
            </CardContent>
          </Card>
        ))}

        <TechniquePicker
          selected={techniques.map((t) => t.id)}
          onToggle={toggle}
          onCustom={(name) => setCustomNames((l) => (l.includes(name) ? l : [...l, name]))}
        />
      </section>

      {/* 스파링 몇 판 (D-64) */}
      <section className="flex items-center justify-between gap-3">
        <h2 id="sparring-title" className="text-[17px] font-semibold">
          스파링
        </h2>
        <div className="flex items-center gap-2" role="group" aria-labelledby="sparring-title">
          <Button
            variant="outline"
            size="icon"
            aria-label="스파링 한 판 빼기"
            className="size-10 rounded-full shadow-none"
            disabled={sparring === 0 || saving}
            onClick={() => setSparring((n) => Math.max(0, n - 1))}
          >
            <Minus />
          </Button>
          <span className="w-14 text-center text-[17px] font-semibold tabular-nums" aria-live="polite">
            {sparring}판
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="스파링 한 판 더하기"
            className="size-10 rounded-full shadow-none"
            disabled={sparring >= 50 || saving}
            onClick={() => setSparring((n) => Math.min(50, n + 1))}
          >
            <Plus />
          </Button>
        </div>
      </section>

      {/* 오늘 메모 — 선택 */}
      <MemoField value={body} onChange={setBody} disabled={saving || deleting} />

      {/* 용어 — 예전 정리하기(AI)로 저장한 기록에만 있다 */}
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

      {/* 기록 지우기 — 저장한 기록에서만 (D-26) */}
      {onDelete && (
        <section className="flex flex-col items-start gap-2 border-t border-border pt-4">
          {!confirmDelete ? (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 rounded-full text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
            >
              <Trash2 data-icon="inline-start" aria-hidden />이 기록 지우기
            </Button>
          ) : (
            <>
              <p className="text-[15px] font-medium">
                이 기록을 지울까요? 되돌릴 수 없어요.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-10 rounded-full border-destructive/40 text-destructive hover:text-destructive"
                  disabled={deleting}
                  onClick={() => startDeleting(() => onDelete())}
                >
                  {deleting && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
                  {deleting ? "지우는 중…" : "지우기"}
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 rounded-full text-muted-foreground"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                >
                  취소
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <BottomAction>
        <Button
          className="h-12 w-full rounded-full text-base shadow-none"
          disabled={!canSave || saving || deleting || generating !== null}
          onClick={() =>
            startSaving(() =>
              onSave({
                body: body.trim(),
                techniques,
                customNames,
                terms: initial.terms,
                aiStatus: initial.aiStatus,
                sparringRounds: sparring,
              }),
            )
          }
        >
          {saving && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
          {saving ? "저장 중…" : canSave ? saveLabel : "기술 · 스파링 · 메모 중 하나를 적어 주세요"}
        </Button>
      </BottomAction>
    </div>
  );
}

// 오늘 메모 — 글상자 + 마이크(브라우저 내장 음성 인식, 녹음 저장 없음, D-12)
function MemoField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  disabled: boolean;
}) {
  const { supported, listening, interim, problem, start, stop, debugLines } = useSpeechInput({
    onText: (text) =>
      onChange((prev) => {
        const sep = prev && !/\s$/.test(prev) ? " " : "";
        return (prev + sep + text).slice(0, MAX_BODY);
      }),
  });
  const shown = interim ? `${value}${value && !/\s$/.test(value) ? " " : ""}${interim}` : value;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[17px] font-semibold">
        오늘 메모 <span className="text-[13px] font-medium text-muted-foreground">선택</span>
      </h2>
      <div className="relative">
        <Textarea
          value={shown}
          onChange={(e) => {
            if (listening) stop(); // 직접 고치기 시작하면 음성 입력은 멈춘다
            onChange(e.target.value.slice(0, MAX_BODY));
          }}
          maxLength={MAX_BODY}
          readOnly={disabled}
          placeholder="느낀 점, 헷갈린 점, 스파링에서 써 본 것 등"
          aria-label="오늘 메모"
          className="min-h-[25dvh] resize-none rounded-2xl bg-card px-4 py-3 pb-16 text-base leading-relaxed"
        />
        {supported && !disabled && (
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {listening && (
              <span role="status" className="text-[13px] font-medium">
                듣는 중…
              </span>
            )}
            <Button
              type="button"
              size="icon-lg"
              onClick={listening ? stop : start}
              aria-label={listening ? "음성 입력 멈추기" : "음성으로 입력하기"}
              aria-pressed={listening}
              className={cn(
                "size-12 rounded-full",
                listening
                  ? "bg-accent text-accent-foreground hover:bg-accent/80"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              {listening ? <MicOff className="size-5" strokeWidth={1.75} /> : <Mic className="size-5" strokeWidth={1.75} />}
            </Button>
          </div>
        )}
      </div>
      <p className="text-[13px] font-medium text-muted-foreground">
        {supported ? "마이크 버튼을 누르고 말해도 돼요." : "키보드의 마이크로 말해도 돼요."}
        {value.length > MAX_BODY * 0.8 && (
          <span className="ml-2 tabular-nums">
            {value.length} / {MAX_BODY}
          </span>
        )}
      </p>
      {problem && (
        <p role="alert" className="text-[13px] leading-relaxed font-medium text-destructive">
          {problem}
        </p>
      )}
      {debugLines.length > 0 && (
        <pre className="overflow-x-auto rounded-xl bg-secondary p-3 text-[12px] leading-relaxed whitespace-pre-wrap">
          {debugLines.join("\n")}
        </pre>
      )}
    </section>
  );
}

function TechniqueCard({
  technique: t,
  youtube,
  onLevel,
  onRemove,
}: {
  technique: MatchedTechnique;
  youtube: boolean;
  onLevel: (id: string, level: Level) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="rounded-2xl ring-border">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <PositionPicture slug={t.positionSlug} size={64} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[17px] font-semibold">
              <span className="mark-lime">{t.nameKo}</span>
            </span>
            <span className="text-[13px] font-medium text-muted-foreground">
              {t.nameEn} · {t.position}
            </span>
            {(t.guess || t.draft) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {t.guess && <Badge variant="secondary">추측</Badge>}
                {t.draft && <Badge variant="outline">{t.mine ? MINE_LABEL[t.mine] : "검수 전"}</Badge>}
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

        <div className="flex items-center justify-between gap-2">
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
          {youtube && <YoutubeLink nameEn={t.nameEn} />}
        </div>
        {open && (
          <div className="flex flex-col gap-1">
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
              {t.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {/* 좌우는 오른손잡이 기준(D-74) */}
            <span className="pl-5 text-[12px] font-medium text-muted-foreground">오른손잡이 기준 · 왼손잡이는 좌우 반대로</span>
            {/* 사람 검증 전이라는 안내(D-86) */}
            <span className="pl-5 text-[12px] leading-relaxed text-muted-foreground">{AI_NOTICE}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-muted-foreground">내 숙련도</span>
          <LevelPicker label={`${t.nameKo} 숙련도`} value={t.level} onChange={(lv) => onLevel(t.id, lv)} />
        </div>
      </CardContent>
    </Card>
  );
}

// 직접 적어 기술 카드 만들기(2026-10-31 본인 요청) — AI 가 만들지 못했을 때, 관리자 초안 화면처럼 포지션을 고르고 내용을 적는다.
// AI 를 부르지 않는다. 만든 카드는 AI 로 만든 것과 같이 '승인 대기' 내 기술이 되고, 관리자가 고쳐 승인하면 모두의 목록에 들어간다.
function ManualTechniqueForm({
  name,
  positions,
  disabled,
  onCreated,
}: {
  name: string;
  positions: { slug: string; nameKo: string }[];
  disabled: boolean;
  onCreated: (res: Extract<GenerateResult, { ok: true }>) => void;
}) {
  const [position, setPosition] = useState("");
  const [nameKo, setNameKo] = useState(name.slice(0, 60));
  const [steps, setSteps] = useState("");
  const [busy, start] = useTransition();
  const id = (k: string) => `manual-${name}-${k}`;
  const lines = steps.split("\n").filter((l) => l.trim());
  const ready = position !== "" && nameKo.trim() !== "" && lines.length > 0;

  const submit = () =>
    start(async () => {
      const res = await createOwnTechnique(name, { position, nameKo, steps: lines }).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      onCreated(res);
    });

  return (
    <div className="mt-2 flex w-full flex-col gap-3 border-t border-border pt-3">
      <p className="text-[13px] font-medium text-muted-foreground">직접 적어서 만들기 — 관리자가 확인 후 모두의 기술 카드가 돼요.</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("position")}>포지션</Label>
        <NativeSelect id={id("position")} className="w-full" value={position} onChange={(e) => setPosition(e.target.value)}>
          <NativeSelectOption value="">고르기</NativeSelectOption>
          {positions.map((p) => (
            <NativeSelectOption key={p.slug} value={p.slug}>
              {p.nameKo}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("name")}>기술 이름</Label>
        <Input id={id("name")} value={nameKo} maxLength={60} onChange={(e) => setNameKo(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("steps")}>세팅 과정 (한 줄에 하나, 1~5줄)</Label>
        <Textarea
          id={id("steps")}
          value={steps}
          rows={4}
          placeholder={"예: 상대 오른쪽 깃을 왼손으로 깊게 잡는다\n오른손으로 상대 왼팔을 누른다"}
          onChange={(e) => setSteps(e.target.value.split("\n").slice(0, 5).join("\n"))}
        />
      </div>
      <Button className="rounded-full" disabled={!ready || busy || disabled} onClick={submit}>
        {busy && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
        기술 카드 만들기
      </Button>
    </div>
  );
}

function withoutKey<T>(m: Record<string, T>, key: string): Record<string, T> {
  const next = { ...m };
  delete next[key];
  return next;
}

// 수업 날짜 고르기 — 새 기록 · 기록 고치기 둘 다(오늘 뒤 날짜는 못 고른다)
export function LogDateInput({ value, today, onChange }: { value: string; today: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      max={today || undefined}
      onChange={(e) => onChange(e.target.value)}
      aria-label="수업 날짜"
      className="h-9 rounded-full border border-input bg-card px-3 text-[13px] font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    />
  );
}
