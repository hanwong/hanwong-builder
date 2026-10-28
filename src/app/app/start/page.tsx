import type { Metadata } from "next";
import { Suspense } from "react";
import { StartForm } from "@/components/app/start-form";

export const metadata: Metadata = { title: "시작하기 — Re:Re:롤" };

// 첫 등록 안내 (D-59) — 처음 로그인하면 여기로 온다(auth callback). 벨트 색 · 수련 시작 연월, 건너뛰기 가능.
export default function StartPage() {
  return (
    <Suspense fallback={<div className="min-h-[70dvh]" aria-hidden />}>
      <StartForm />
    </Suspense>
  );
}
