"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LogEditor, formatKoreanDate } from "@/components/app/log-editor";
import { LogReview } from "@/components/app/log-review";
import { organizeLog } from "@/app/app/log/actions";
import type { MatchedTechnique, Term } from "@/lib/mock/log-seed";

// 오늘 배운 것 기록 — 한 화면 3상태 (FLOW 4).
// A 쓰기(T-05) → "정리하기" → 서버가 글에서 기술 · 용어를 찾음(T-06) → C 확인.
// B 정리 중 화면 · 오류 시 "다시 시도 / 그냥 저장" 은 T-07 에서 다듬는다. 지금은 버튼에 "정리 중…".
type Organized = {
  body: string;
  loggedOn: string;
  isMock: boolean;
  techniques: MatchedTechnique[];
  terms: Term[];
};

export function LogFlow() {
  const [result, setResult] = useState<Organized | null>(null);
  const [saved, setSaved] = useState({ body: "", loggedOn: "" });
  const [pending, startTransition] = useTransition();

  if (result) {
    return (
      <LogReview
        initial={{ ...result, loggedOn: formatKoreanDate(result.loggedOn) }}
        onBack={() => {
          setSaved({ body: result.body, loggedOn: result.loggedOn });
          setResult(null);
        }}
      />
    );
  }
  return (
    <LogEditor
      initialBody={saved.body}
      initialDate={saved.loggedOn || undefined}
      pending={pending}
      onSubmit={({ body, loggedOn }) => {
        setSaved({ body, loggedOn });
        startTransition(async () => {
          const res = await organizeLog(body).catch(() => null);
          if (!res || !res.ok) {
            toast.error(res?.message ?? "정리하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
            return;
          }
          setResult({ body, loggedOn, isMock: res.isMock, techniques: res.techniques, terms: res.terms });
        });
      }}
    />
  );
}
