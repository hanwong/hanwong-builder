import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// 브라우저 내장 음성 인식(Web Speech API) 훅 — D-12. 녹음은 저장하지 않고 글만 받는다.
// 브라우저 음성 인식은 불안정하다: 말이 끝나거나 조용하면 스스로 끝나고, 끝난 직후 너무 빨리
// 다시 켜면 실패하고, 크롬 계열이 아니면 서버에 못 닿기도 한다.
// 그래서 (1) 사용자가 끌 때까지 간격을 두고 다시 켜고 (2) 오래된 인식기의 늦은 신호는 무시하고
// (3) 정말 못 쓰는 경우는 이유를 알려 주고 마이크 버튼을 접어 키보드 받아쓰기로 안내한다.
// URL 에 ?debug=1 을 붙이면 무슨 일이 있었는지 화면 아래에 보여 준다(원인 찾기용).

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onaudiostart?: (() => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
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
  network:
    "음성 인식 서버에 연결하지 못했어요. 이 브라우저에서는 음성 인식이 안 될 수 있어요(크롬 · 사파리 권장). 키보드의 마이크(받아쓰기)를 써 주세요.",
};
// 이 오류가 첫 인식도 못 하고 났다면 이 브라우저에선 못 쓴다고 보고 마이크 버튼을 접는다
// (service-not-allowed 는 휴대폰 설정으로 고칠 수 있어서 버튼을 남긴다)
const GIVE_UP_BUTTON = new Set(["network", "language-not-supported"]);

const IN_APP_MESSAGE =
  "카카오톡 · 인스타그램 같은 앱 안의 브라우저에서는 마이크가 안 돼요. 메뉴에서 '다른 브라우저로 열기'(크롬 · 사파리)를 눌러 주세요. 키보드의 마이크로 말해도 돼요.";

function isInAppBrowser(ua: string): boolean {
  return /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\/|DaumApps|Snapchat|; wv\)/i.test(ua);
}
function isIOS(ua: string): boolean {
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1)
  );
}

// 브라우저 환경(한 번만 계산) — 서버(미리 만들기)에서는 "지원 안 함"으로 두었다가 브라우저에서 진짜 값으로 바뀐다
type Env = { supported: boolean; inApp: boolean; ios: boolean; debug: boolean };
const SERVER_ENV: Env = { supported: false, inApp: false, ios: false, debug: false };
let envCache: Env | null = null;
function readEnv(): Env {
  if (envCache) return envCache;
  const ua = navigator.userAgent;
  const inApp = isInAppBrowser(ua);
  envCache = {
    supported: !inApp && getCtor() !== null,
    inApp,
    ios: isIOS(ua),
    debug: new URLSearchParams(window.location.search).get("debug") === "1",
  };
  return envCache;
}
const noSubscribe = () => () => {};

const RESTART_MS = 600; // 끝난 직후 바로 켜면 모바일에서 실패한다
const QUICK_MS = 1000; // 이보다 빨리 꺼지고 아무 신호도 없으면 "바로 꺼짐"
const MAX_QUICK_ENDS = 3;
const MAX_NO_SPEECH = 3;
const MAX_ABORTED = 6;

export function useSpeechInput({ onText }: { onText: (finalText: string) => void }) {
  const env = useSyncExternalStore(noSubscribe, readEnv, () => SERVER_ENV);
  const [gaveUp, setGaveUp] = useState(false); // 첫 시도부터 못 쓰는 오류 → 마이크 버튼을 접는다
  const supported = env.supported && !gaveUp;
  const [problemState, setProblem] = useState<string | null>(null); // 화면에 계속 남기는 안내
  const problem = problemState ?? (env.inApp ? IN_APP_MESSAGE : null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const recRef = useRef<Recognition | null>(null);
  const wantRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const gotResultRef = useRef(false); // 이번 인식기에서 결과가 있었나
  const workedRef = useRef(false); // 이번 마이크 켜기 동안 한 번이라도 결과가 있었나
  const quickEndsRef = useRef(0);
  const noSpeechRef = useRef(0);
  const abortedRef = useRef(0);
  const lastErrorRef = useRef("");
  const debugRef = useRef(false);
  const t0Ref = useRef(0);
  const onTextRef = useRef(onText);
  const iosRef = useRef(false);
  const beginRef = useRef<() => void>(() => {}); // begin 이 자기 자신을 다시 켤 때 쓴다(아래에서 채움)
  useEffect(() => {
    onTextRef.current = onText;
    debugRef.current = env.debug;
    iosRef.current = env.ios;
  });

  const note = useCallback((text: string) => {
    if (!debugRef.current) return;
    const sec = ((Date.now() - t0Ref.current) / 1000).toFixed(1);
    setDebugLines((l) => [...l.slice(-14), `${sec}s ${text}`]);
  }, []);

  useEffect(() => {
    // 화면을 떠날 때 인식기 정리
    return () => {
      wantRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      const r = recRef.current;
      recRef.current = null;
      r?.abort();
    };
  }, []);

  const finish = useCallback(
    (message?: string) => {
      wantRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setListening(false);
      setInterim("");
      note(`멈춤${message ? `: ${message.slice(0, 30)}…` : ""}`);
      if (message) setProblem(message);
    },
    [note],
  );

  const begin = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || !wantRef.current) return;
    const rec = new Ctor();
    rec.lang = "ko-KR";
    // 안드로이드 · 데스크탑 크롬: 한 문장씩 받고 끝나면 다시 켠다(continuous 중복 · 조기 종료를 피함)
    // 아이폰 사파리: 손가락으로 누르지 않은 재시작이 막힐 수 있어 한 번 켜서 계속 듣는다
    rec.continuous = iosRef.current;
    rec.interimResults = true;
    startedAtRef.current = Date.now();
    gotResultRef.current = false;
    lastErrorRef.current = "";
    const mine = () => recRef.current === rec; // 오래된 인식기의 늦은 신호는 무시

    rec.onaudiostart = () => mine() && note("마이크 소리 받기 시작");
    rec.onspeechstart = () => mine() && note("말소리 감지");
    rec.onspeechend = () => mine() && note("말소리 끝");

    rec.onresult = (e) => {
      if (!mine()) return;
      gotResultRef.current = true;
      workedRef.current = true;
      quickEndsRef.current = 0;
      noSpeechRef.current = 0;
      abortedRef.current = 0;
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      note(finalText ? `결과(확정): ${finalText.trim().slice(0, 12)}` : `결과(진행 중)`);
      if (finalText.trim()) onTextRef.current(finalText.trim());
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (!mine()) return;
      lastErrorRef.current = e.error;
      note(`오류: ${e.error}`);
      const fatal = FATAL[e.error];
      if (e.error === "not-allowed" && workedRef.current) {
        // 잘 되다가 자동 재시작에서 막힘(브라우저가 손가락 입력 없는 시작을 막음)
        finish("마이크가 멈췄어요. 마이크 버튼을 한 번 더 눌러 주세요.");
      } else if (fatal) {
        const first = !workedRef.current;
        finish(`${fatal} (오류: ${e.error})`);
        if (first && GIVE_UP_BUTTON.has(e.error)) setGaveUp(true);
      } else if (e.error === "no-speech") {
        noSpeechRef.current += 1;
      } else if (e.error === "aborted") {
        abortedRef.current += 1;
      } else {
        finish(`음성 인식이 멈췄어요. 다시 눌러 주세요. (오류: ${e.error})`);
      }
    };

    rec.onend = () => {
      if (!mine()) return;
      recRef.current = null;
      setInterim("");
      note("인식 끝");
      if (!wantRef.current) {
        setListening(false);
        return;
      }
      if (noSpeechRef.current >= MAX_NO_SPEECH) {
        finish("말소리가 들리지 않아 멈췄어요. 다시 눌러 주세요.");
        return;
      }
      if (abortedRef.current >= MAX_ABORTED) {
        finish("음성 인식이 계속 끊겨요. 다시 눌러 주세요.");
        return;
      }
      const quick =
        Date.now() - startedAtRef.current < QUICK_MS && !gotResultRef.current && lastErrorRef.current === "";
      if (quick) {
        quickEndsRef.current += 1;
        if (quickEndsRef.current >= MAX_QUICK_ENDS) {
          finish("음성 인식이 계속 바로 꺼져요. 마이크 권한과 받아쓰기 설정을 확인해 주세요.");
          return;
        }
      }
      // 사용자가 아직 끄지 않았으니 간격을 두고 다시 켠다
      note(`${RESTART_MS}ms 뒤 다시 켬`);
      timerRef.current = setTimeout(() => beginRef.current(), RESTART_MS);
    };

    recRef.current = rec;
    try {
      rec.start();
      note("시작");
    } catch {
      recRef.current = null;
      note("start() 실패 — 다시 시도");
      timerRef.current = setTimeout(() => beginRef.current(), RESTART_MS);
    }
  }, [finish, note]);
  useEffect(() => {
    beginRef.current = begin;
  }, [begin]);

  const start = useCallback(() => {
    if (!getCtor()) return;
    wantRef.current = true;
    quickEndsRef.current = 0;
    noSpeechRef.current = 0;
    abortedRef.current = 0;
    workedRef.current = false;
    t0Ref.current = Date.now();
    setDebugLines([]);
    setProblem(null);
    setListening(true);
    begin();
  }, [begin]);

  const stop = useCallback(() => {
    wantRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setListening(false);
    setInterim("");
    note("사용자가 멈춤");
    recRef.current?.stop();
  }, [note]);

  return { supported, listening, interim, problem, start, stop, debugLines };
}
