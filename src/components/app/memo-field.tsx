"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_BODY } from "@/lib/log-limits";
import { useSpeechInput } from "@/lib/use-speech-input";

// 메모 칸 — 글상자 + 마이크(브라우저 내장 음성 인식, 녹음 저장 없음, D-12).
// 기록 "오늘 메모"와 관장 · 코치의 수업 메모(D-159)가 같이 쓴다
export function MemoField({
  value,
  onChange,
  disabled,
  title,
  placeholder,
  ariaLabel,
  max = MAX_BODY,
  footnote,
}: {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  disabled: boolean;
  title: ReactNode;
  placeholder: string;
  ariaLabel: string;
  max?: number;
  footnote?: ReactNode; // 마이크 안내 아래 한 줄
}) {
  const { supported, listening, interim, problem, start, stop, debugLines } = useSpeechInput({
    onText: (text) =>
      onChange((prev) => {
        const sep = prev && !/\s$/.test(prev) ? " " : "";
        return (prev + sep + text).slice(0, max);
      }),
  });
  const shown = interim ? `${value}${value && !/\s$/.test(value) ? " " : ""}${interim}` : value;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <div className="relative">
        <Textarea
          value={shown}
          onChange={(e) => {
            if (listening) stop(); // 직접 고치기 시작하면 음성 입력은 멈춘다
            onChange(e.target.value.slice(0, max));
          }}
          maxLength={max}
          readOnly={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
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
        {value.length > max * 0.8 && (
          <span className="ml-2 tabular-nums">
            {value.length} / {max}
          </span>
        )}
      </p>
      {footnote}
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
