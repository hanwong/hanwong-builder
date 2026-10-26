"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSpeechInput } from "@/lib/use-speech-input";
import { MAX_BODY } from "@/lib/log-limits";
import { seoulToday } from "@/lib/seoul-date";

// 오늘 배운 것 기록 — 상태 A 쓰기 (FLOW.md 4 · D-03 · D-12).
// 쓰는 동안은 아무것도 추천하지 않는다. 마이크는 브라우저 내장 음성 인식(녹음 저장 없음).

type Props = {
  initialBody?: string;
  initialDate?: string;
  locked?: boolean; // 상태 B(정리 중 · 실패) — 글은 그대로 보이고 고칠 수 없다
  below?: ReactNode; // 글상자 아래(정리 중 스켈레톤 · 오류 안내)
  footer?: ReactNode; // 하단 고정 버튼 자리. 없으면 "정리하기"
  onSubmit: (value: { body: string; loggedOn: string }) => void;
};

export function LogEditor({ initialBody = "", initialDate, locked = false, below, footer, onSubmit }: Props) {
  const [body, setBody] = useState(initialBody);
  const [date, setDate] = useState(initialDate ?? "");
  const [today, setToday] = useState("");
  const { supported, listening, interim, problem, start, stop, debugLines } = useSpeechInput({
    onText: (text) =>
      setBody((prev) => {
        const sep = prev && !/\s$/.test(prev) ? " " : "";
        return (prev + sep + text).slice(0, MAX_BODY);
      }),
  });

  useEffect(() => {
    const t = seoulToday();
    setToday(t);
    setDate((d) => d || t);
  }, []);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0;
  const shown = interim ? `${body}${body && !/\s$/.test(body) ? " " : ""}${interim}` : body;

  function submit() {
    if (!canSubmit || locked) return;
    stop();
    onSubmit({ body: trimmed, loggedOn: date || today });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">오늘 배운 것</h1>
        <label className="ml-auto flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <span className="sr-only">수업 날짜</span>
          <input
            type="date"
            value={date}
            max={today || undefined}
            disabled={locked}
            onChange={(e) => setDate(e.target.value)}
            aria-label="수업 날짜"
            className="h-9 rounded-full border border-input bg-card px-3 text-[13px] font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
      </header>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Textarea
            value={shown}
            onChange={(e) => {
              if (listening) stop(); // 직접 고치기 시작하면 음성 입력은 멈춘다
              setBody(e.target.value.slice(0, MAX_BODY));
            }}
            maxLength={MAX_BODY}
            readOnly={locked}
            placeholder="오늘 배운 걸 아는 대로 적어 주세요. 이름 몰라도 돼요."
            aria-label="오늘 배운 것"
            className="min-h-[40dvh] resize-none rounded-2xl bg-card px-4 py-3 pb-16 text-base leading-relaxed"
          />
          {supported && !locked && (
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
        <p className={cn("text-[13px] font-medium text-muted-foreground", locked && "hidden")}>
          {supported
            ? "마이크 버튼을 누르고 말해도 돼요. 상대 이름은 적지 않아도 돼요."
            : "키보드의 마이크로 말해도 돼요. 상대 이름은 적지 않아도 돼요."}
          {body.length > MAX_BODY * 0.8 && (
            <span className="ml-2 tabular-nums">
              {body.length} / {MAX_BODY}
            </span>
          )}
        </p>
        {problem && (
          <p role="alert" className="text-[13px] leading-relaxed font-medium text-destructive">
            {problem}
          </p>
        )}
      </div>

      {below}

      {debugLines.length > 0 && (
        <pre className="overflow-x-auto rounded-xl bg-secondary p-3 text-[12px] leading-relaxed whitespace-pre-wrap">
          {debugLines.join("\n")}
        </pre>
      )}

      {/* 자리 확보 + 정리하기 — 하단 탭 위에 고정 */}
      <div className="h-16" aria-hidden />
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-10 px-4">
        <div className="mx-auto max-w-md">
          {footer ?? (
            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="h-12 w-full rounded-full text-base shadow-none"
            >
              <Sparkles data-icon="inline-start" aria-hidden />
              정리하기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
