import { useCallback, useEffect, useRef, useState } from "react";

// 브라우저 내장 음성 인식(Web Speech API) 훅 — D-12. 녹음은 저장하지 않고 글만 받는다.
// 휴대폰 브라우저는 말이 끝나거나 조용하면 인식을 스스로 끝내므로,
// 사용자가 끌 때까지 자동으로 다시 켠다. 정말 못 쓰는 경우는 이유를 알려 준다.

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
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// 다시 켜 봐야 소용없는 오류 → 멈추고 이유 안내
const FATAL: Record<string, string> = {
  "not-allowed": "마이크를 쓸 수 없어요. 브라우저(또는 사이트) 설정에서 마이크를 허용해 주세요.",
  "service-not-allowed":
    "음성 인식을 쓸 수 없어요. 휴대폰 설정에서 받아쓰기(아이폰은 Siri · 받아쓰기)가 켜져 있는지 확인해 주세요.",
  "audio-capture": "마이크를 찾지 못했어요. 다른 앱이 마이크를 쓰고 있지 않은지 확인해 주세요.",
  "language-not-supported": "이 브라우저는 한국어 음성 인식을 지원하지 않아요. 키보드의 마이크를 써 주세요.",
  network: "인터넷 연결을 확인해 주세요. 음성 인식은 인터넷이 필요해요.",
};

const QUICK_MS = 1000; // 이보다 빨리 꺼지고 결과도 없으면 "바로 꺼짐"으로 센다
const MAX_QUICK_ENDS = 3;
const MAX_NO_SPEECH = 3;

export function useSpeechInput({
  onText,
  onProblem,
}: {
  onText: (finalText: string) => void;
  onProblem: (message: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");

  const recRef = useRef<Recognition | null>(null);
  const wantRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const gotResultRef = useRef(false);
  const quickEndsRef = useRef(0);
  const noSpeechRef = useRef(0);
  const lastErrorRef = useRef("");
  const onTextRef = useRef(onText);
  const onProblemRef = useRef(onProblem);
  useEffect(() => {
    onTextRef.current = onText;
    onProblemRef.current = onProblem;
  });

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => {
      wantRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      recRef.current?.abort();
    };
  }, []);

  const finish = useCallback((message?: string) => {
    wantRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setListening(false);
    setInterim("");
    if (message) onProblemRef.current(message);
  }, []);

  const begin = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || !wantRef.current) return;
    const rec = new Ctor();
    rec.lang = "ko-KR";
    // 한 문장씩 받고 끝나면 다시 켠다 (모바일 크롬의 continuous 중복 · 조기 종료를 피함)
    rec.continuous = false;
    rec.interimResults = true;
    startedAtRef.current = Date.now();
    gotResultRef.current = false;
    lastErrorRef.current = "";

    rec.onresult = (e) => {
      gotResultRef.current = true;
      quickEndsRef.current = 0;
      noSpeechRef.current = 0;
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText.trim()) onTextRef.current(finalText.trim());
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      lastErrorRef.current = e.error;
      const fatal = FATAL[e.error];
      if (fatal) {
        finish(fatal);
      } else if (e.error === "no-speech") {
        noSpeechRef.current += 1;
      } else if (e.error !== "aborted") {
        finish(`음성 인식이 멈췄어요. 다시 눌러 주세요. (오류: ${e.error})`);
      }
    };

    rec.onend = () => {
      recRef.current = null;
      setInterim("");
      if (!wantRef.current) {
        setListening(false);
        return;
      }
      if (noSpeechRef.current >= MAX_NO_SPEECH) {
        finish("말소리가 들리지 않아 멈췄어요. 다시 눌러 주세요.");
        return;
      }
      const quick = Date.now() - startedAtRef.current < QUICK_MS && !gotResultRef.current;
      if (quick && lastErrorRef.current !== "no-speech") {
        quickEndsRef.current += 1;
        if (quickEndsRef.current >= MAX_QUICK_ENDS) {
          finish("음성 인식이 계속 바로 꺼져요. 마이크 권한과 받아쓰기 설정을 확인해 주세요.");
          return;
        }
      }
      // 사용자가 아직 끄지 않았으니 잠깐 뒤 다시 켠다
      timerRef.current = setTimeout(begin, 250);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      recRef.current = null;
      timerRef.current = setTimeout(begin, 300);
    }
  }, [finish]);

  const start = useCallback(() => {
    if (!getCtor()) return;
    wantRef.current = true;
    quickEndsRef.current = 0;
    noSpeechRef.current = 0;
    setListening(true);
    begin();
  }, [begin]);

  const stop = useCallback(() => {
    wantRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setListening(false);
    setInterim("");
    recRef.current?.stop();
  }, []);

  return { supported, listening, interim, start, stop };
}
