"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechInput } from "@/lib/use-speech-input";
import { askQuestion } from "@/app/app/ask/actions";

// 질문하기 (D-100 · D-115) — 글상자(마이크는 기록 메모와 같음) · 예시 칩 · 오늘 남은 횟수 · "질문하기". 답을 저장하면 그 질문 화면으로.
const MAX = 500;
const EXAMPLES = [
  { label: "하프가드에서 눌릴 때", text: "하프가드 아래에서 상대가 크로스페이스로 누르면 어떻게 해요?" },
  { label: "다리로 허리를 감았을 때", text: "상대가 누워서 두 다리로 내 허리를 감고 있으면 어떻게 빠져나와요?" },
  { label: "사이드에 깔렸을 때", text: "사이드 컨트롤 아래에 깔려서 숨이 막힐 때 어떻게 빠져나와요?" },
];

// compact(시험 홈 D-115): 예시 칩 없이, 안내는 한 줄
export function AskForm({ left, limit, compact = false }: { left: number; limit: number; compact?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startAsk] = useTransition();
  const { supported, listening, interim, problem, start, stop } = useSpeechInput({
    onText: (t) => setText((prev) => (prev + (prev && !/\s$/.test(prev) ? " " : "") + t).slice(0, MAX)),
  });
  const shown = interim ? `${text}${text && !/\s$/.test(text) ? " " : ""}${interim}` : text;
  const ready = text.trim().length >= 2 && !pending && left > 0;

  function submit() {
    if (!ready) return;
    if (listening) stop();
    startAsk(async () => {
      const res = await askQuestion(text).catch(() => null);
      if (res?.ok) router.push(`/app/ask/${res.id}`);
      else toast.error(res?.message ?? "답을 만들지 못했어요 — 다시 눌러 주세요.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Textarea
          value={shown}
          onChange={(e) => {
            if (listening) stop();
            setText(e.target.value.slice(0, MAX));
          }}
          maxLength={MAX}
          readOnly={pending}
          placeholder="무엇이 궁금해요? 포지션 이름을 몰라도 상황을 말로 적으면 돼요."
          aria-label="질문"
          className="min-h-[22dvh] resize-none rounded-2xl bg-card px-4 py-3 pb-16 text-base leading-relaxed"
        />
        {supported && !pending && (
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
              {listening ? (
                <MicOff className="size-5" strokeWidth={1.75} />
              ) : (
                <Mic className="size-5" strokeWidth={1.75} />
              )}
            </Button>
          </div>
        )}
      </div>
      {problem && (
        <p role="alert" className="text-[13px] leading-relaxed font-medium text-destructive">
          {problem}
        </p>
      )}

      {/* 시험 홈(compact)은 예시 없이 — 본인 요청 2026-11-04 */}
      {!compact && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-muted-foreground">이렇게 물어봐도 돼요</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              disabled={pending}
              onClick={() => setText(ex.text)}
              className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-[14px] leading-snug transition-colors hover:bg-muted disabled:opacity-50"
            >
              {ex.text}
            </button>
          ))}
        </div>
      )}

      {compact ? (
        <p className="text-[12px] text-muted-foreground">
          질문 글만 AI 에 보내져요(누가 물었는지는 빼고) ·{" "}
          <a href="/privacy" className="underline underline-offset-4">
            자세히
          </a>
        </p>
      ) : (
        <p className="text-[13px] leading-relaxed font-medium text-muted-foreground">
          질문 글은 답을 만들고, 밤마다 기술 지도를 넓히는 데 AI(Anthropic Claude)에 보내져요. 누가 물었는지는
          보내지 않아요. 사람 이름은 적지 마세요.
        </p>
      )}
      <Button className="h-12 w-full gap-2 rounded-full text-base shadow-none" disabled={!ready} onClick={submit}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "기술 지도를 찾아보는 중…" : left > 0 ? "질문하기" : "오늘 질문을 다 썼어요"}
      </Button>
      <p className="text-center text-[13px] font-medium text-muted-foreground tabular-nums">
        오늘 남은 질문 {left} / {limit}
      </p>
    </div>
  );
}
