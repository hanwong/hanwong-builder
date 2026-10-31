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

// 질문하기 (D-100) — 글상자(마이크는 기록 메모와 같음) · 예시 칩 · "질문하기". 답을 저장하면 그 질문 화면으로.
const MAX = 500;
const EXAMPLES = [
  "하프가드 아래에서 상대가 크로스페이스로 누르면 어떻게 해요?",
  "상대가 누워서 두 다리로 내 허리를 감고 있으면 어떻게 빠져나와요?",
];

export function AskForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startAsk] = useTransition();
  const { supported, listening, interim, problem, start, stop } = useSpeechInput({
    onText: (t) => setText((prev) => (prev + (prev && !/\s$/.test(prev) ? " " : "") + t).slice(0, MAX)),
  });
  const shown = interim ? `${text}${text && !/\s$/.test(text) ? " " : ""}${interim}` : text;
  const ready = text.trim().length >= 2 && !pending;

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

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">이렇게 물어봐도 돼요</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={pending}
            onClick={() => setText(ex)}
            className="rounded-2xl border border-border bg-card px-4 py-2.5 text-left text-[14px] leading-snug transition-colors hover:bg-muted disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <p className="text-[13px] leading-relaxed font-medium text-muted-foreground">
        질문은 답을 만들기 위해 AI 에 보내져요. 상대 이름은 적지 마세요.
      </p>
      <Button className="h-12 w-full gap-2 rounded-full text-base shadow-none" disabled={!ready} onClick={submit}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "기술 지도를 찾아보는 중…" : "질문하기"}
      </Button>
    </div>
  );
}
