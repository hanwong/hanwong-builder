"use client";

import { useState } from "react";
import { LogEditor, formatKoreanDate } from "@/components/app/log-editor";
import { LogReview } from "@/components/app/log-review";
import { seedLog } from "@/lib/mock/log-seed";

// 오늘 배운 것 기록 — 한 화면 3상태 (FLOW 4). 지금은 A(쓰기, T-05)만 진짜.
// "정리하기" 뒤 화면(B 정리 중 · C 확인)은 T-06 · T-07 에서 서버 결과로 바꾼다.
// 그 전까지는 4단계 때 만든 연습용 예시(가짜 기술 2개)를 보여 준다.
export function LogFlow() {
  const [draft, setDraft] = useState<{ body: string; loggedOn: string } | null>(null);
  const [saved, setSaved] = useState({ body: "", loggedOn: "" });

  if (draft) {
    return (
      <LogReview
        initial={{
          ...seedLog,
          body: draft.body,
          loggedOn: formatKoreanDate(draft.loggedOn),
        }}
        onBack={() => {
          setSaved(draft);
          setDraft(null);
        }}
      />
    );
  }
  return (
    <LogEditor initialBody={saved.body} initialDate={saved.loggedOn || undefined} onSubmit={setDraft} />
  );
}
