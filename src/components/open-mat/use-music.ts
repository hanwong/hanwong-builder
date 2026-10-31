"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 오픈매트 배경 음악(본인 요청 2026-10-31). Pixabay Content License — 상업 사용 · 출처 표시 없이 가능, 이 화면처럼
// 다른 요소와 함께 쓰는 것은 '그대로 재배포'가 아니다. 파일은 public/music(128kbps AAC 로 줄임).
// 브라우저는 사용자가 누르기 전엔 소리를 못 내서 처음엔 꺼짐 · 각자 휴대폰에서만 들림(맞춰 틀지 않음).
export const TRACKS = [
  { src: "/music/soundsurfer-workout.m4a", title: "Workout", artist: "SoundSurfer" },
  { src: "/music/tatamusic-workout.m4a", title: "Workout", artist: "Tatamusic" },
  { src: "/music/prettyjohn1-workout.m4a", title: "Workout", artist: "prettyjohn1" },
] as const;

export function useMusic() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const a = new Audio();
    a.preload = "none"; // 켜기 전엔 받지 않는다(데이터 아끼기)
    a.volume = 0.45;
    audio.current = a;
    return () => {
      a.pause();
      a.src = "";
      audio.current = null;
    };
  }, []);

  // 한 곡이 끝나면 다음 곡(마지막 다음은 처음)
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const next = () => setIndex((i) => (i + 1) % TRACKS.length);
    a.addEventListener("ended", next);
    return () => a.removeEventListener("ended", next);
  }, []);

  useEffect(() => {
    const a = audio.current;
    if (!a || !on) return;
    const src = TRACKS[index].src;
    if (!a.src.endsWith(src)) a.src = src;
    a.play().catch(() => setOn(false)); // 막히면 다시 꺼진 상태로
  }, [on, index]);

  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    if (on) {
      a.pause();
      setOn(false);
    } else {
      setOn(true);
    }
  }, [on]);

  return { on, track: TRACKS[index], toggle };
}
