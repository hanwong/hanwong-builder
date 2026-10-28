"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogReview } from "@/components/app/log-review";
import { saveLog } from "@/app/app/log/actions";
import { seoulToday } from "@/lib/seoul-date";
import { forgetPicker } from "@/lib/picker-store";

const noSubscribe = () => () => {};

// 오늘 배운 것 기록 — 한 화면(D-56): 날짜 → 배운 기술 고르기 → 오늘 메모 → 저장.
export function LogFlow() {
  const router = useRouter();
  const [round, setRound] = useState(0); // 저장하면 빈 화면부터 다시
  const [date, setDate] = useState(""); // 비어 있으면 오늘
  // 서울 기준 오늘 — 서버(미리 만들기)에서는 빈 값, 브라우저에서 날짜로 바뀐다(cacheComponents: 렌더 중 new Date() 금지)
  const today = useSyncExternalStore(noSubscribe, seoulToday, () => "");
  const loggedOn = date || today;

  // 저장하면 바로 이전 화면(홈 · 기록 목록 · 기술 상세)으로 간다. Next 는 떠난 화면을 숨겨 보관하므로(Activity),
  // 숨겨질 때(layout effect 정리) 비워 두면 다시 들어올 때 빈 화면부터 보인다 — 저장 뒤 빈 화면이 깜빡이지 않는다.
  const saved = useRef(false);
  useLayoutEffect(
    () => () => {
      if (!saved.current) return;
      saved.current = false;
      setRound((r) => r + 1);
      setDate("");
    },
    [],
  );

  return (
    <LogReview
      key={round}
      youtube={false}
      initial={{ loggedOn: "", body: "", techniques: [], customNames: [], terms: [], aiStatus: "none", sparringRounds: 0 }}
      date={
        <input
          type="date"
          value={loggedOn}
          max={today || undefined}
          onChange={(e) => setDate(e.target.value)}
          aria-label="수업 날짜"
          className="h-9 rounded-full border border-input bg-card px-3 text-[13px] font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      }
      onSave={async (value) => {
        const res = await saveLog({
          loggedOn,
          body: value.body,
          aiStatus: "none",
          techniques: value.techniques.map((t) => ({ slug: t.id, level: t.level })),
          customNames: value.customNames,
          terms: [],
          sparringRounds: value.sparringRounds,
        }).catch(() => null);
        if (!res || !res.ok) {
          toast.error(res?.message ?? "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
          return;
        }
        toast.success("기록을 저장했어요");
        forgetPicker(); // 숙련도가 바뀌었다 — 다음 고르기는 새로 받는다
        saved.current = true;
        // 주소로 바로 열어 돌아갈 곳이 없으면 홈으로
        if (window.history.length > 1) router.back();
        else router.replace("/app");
      }}
    />
  );
}
