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

// 질문하기 (D-100 · D-115) — 글상자(마이크는 기록 메모와 같음) · 오늘 남은 횟수 · "질문하기". 답을 저장하면 그 질문 화면으로.
const MAX = 500;

export function AskForm({ left, limit }: { left: number; limit: number }) {
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

      <p className="text-[12px] text-muted-foreground">
        질문 글만 AI 에 보내져요(누가 물었는지는 빼고) ·{" "}
        <a href="/privacy" className="underline underline-offset-4">
          자세히
        </a>
      </p>
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
