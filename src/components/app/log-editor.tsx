"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 오늘 배운 것 기록 — 상태 A 쓰기 (FLOW.md 4 · D-03 · D-12).
// 쓰는 동안은 아무것도 추천하지 않는다. 마이크는 브라우저 내장 음성 인식(녹음 저장 없음).

export const MAX_BODY = 5000; // DB class_logs_body_len 과 같게

// 브라우저 음성 인식 최소 타입 (표준 lib 에 없음)
type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// 서울 기준 오늘 (YYYY-MM-DD). 렌더 중이 아니라 effect 안에서만 부른다(cacheComponents).
function seoulToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA 는 YYYY-MM-DD
}

export function formatKoreanDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 (${dow})`;
}

type Props = {
  initialBody?: string;
  initialDate?: string;
  onSubmit: (value: { body: string; loggedOn: string }) => void;
};

export function LogEditor({ initialBody = "", initialDate, onSubmit }: Props) {
  const [body, setBody] = useState(initialBody);
  const [date, setDate] = useState(initialDate ?? "");
  const [today, setToday] = useState("");
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    const t = seoulToday();
    setToday(t);
    setDate((d) => d || t);
    setSupported(getRecognitionCtor() !== null);
    return () => recRef.current?.stop();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  function start() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) {
        setBody((prev) => {
          const sep = prev && !/\s$/.test(prev) ? " " : "";
          return (prev + sep + finalText.trim()).slice(0, MAX_BODY);
        });
      }
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("마이크를 쓸 수 없어요. 브라우저 설정에서 마이크를 허용해 주세요.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error("음성 인식이 멈췄어요. 다시 눌러 주세요.");
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      recRef.current = null;
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0;
  const shown = interim ? `${body}${body && !/\s$/.test(body) ? " " : ""}${interim}` : body;

  function submit() {
    if (!canSubmit) return;
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
              setInterim("");
              setBody(e.target.value.slice(0, MAX_BODY));
            }}
            maxLength={MAX_BODY}
            placeholder="오늘 배운 걸 아는 대로 적어 주세요. 이름 몰라도 돼요."
            aria-label="오늘 배운 것"
            className="min-h-[40dvh] resize-none rounded-2xl bg-card px-4 py-3 pb-16 text-base leading-relaxed"
          />
          {supported && (
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
          {supported
            ? "마이크 버튼을 누르고 말해도 돼요. 상대 이름은 적지 않아도 돼요."
            : "키보드의 마이크로 말해도 돼요. 상대 이름은 적지 않아도 돼요."}
          {body.length > MAX_BODY * 0.8 && (
            <span className="ml-2 tabular-nums">
              {body.length} / {MAX_BODY}
            </span>
          )}
        </p>
      </div>

      {/* 자리 확보 + 정리하기 — 하단 탭 위에 고정 */}
      <div className="h-16" aria-hidden />
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-10 px-4">
        <div className="mx-auto max-w-md">
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="h-12 w-full rounded-full text-base shadow-none"
          >
            <Sparkles data-icon="inline-start" aria-hidden />
            정리하기
          </Button>
        </div>
      </div>
    </div>
  );
}
