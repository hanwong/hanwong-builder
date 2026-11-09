"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogDateInput, LogReview } from "@/components/app/log-review";
import { ShareLog } from "@/components/app/share-log";
import { deleteLog, updateLog } from "@/app/app/log/actions";
import { formatKoreanDate, seoulToday } from "@/lib/seoul-date";
import { forgetPicker } from "@/lib/picker-store";
import type { SavedLog } from "@/lib/log-data";

const noSubscribe = () => () => {};

// 저장한 기록 보기 · 고치기 (D-25) — 새 기록과 같은 화면(D-56).
export function LogDetail({ log }: { log: SavedLog }) {
  const router = useRouter();
  // 들어온 곳(기록 목록 · 홈 · 기술 상세)으로 돌아간다. 주소로 바로 열어 돌아갈 곳이 없으면 기록 목록으로.
  const goBack = () => (window.history.length > 1 ? router.back() : router.push("/app/logs"));
  // 날짜도 고칠 수 있다(본인 요청 2026-10-31) — 새 기록과 같은 날짜 고르기
  const [loggedOn, setLoggedOn] = useState(log.loggedOn);
  const today = useSyncExternalStore(noSubscribe, seoulToday, () => "");

  // 늘 저장된 값(DB) 기준으로(D-141) — 이 Next 는 떠난 화면을 숨겨 두었다가 뒤로 가기에 그대로 다시 보여 줘서
  // 저장 안 한 수정이 남았다. 화면이 다시 보일 때마다(숨김 → 보임에 effect 가 다시 돈다) 서버 값을 새로 받고 고치던 칸을 버린다.
  const [round, setRound] = useState(0);
  const shown = useRef(false);
  useEffect(() => {
    if (!shown.current) {
      shown.current = true;
      return;
    }
    setRound((r) => r + 1); // 다시 보일 때 한 번, 고치던 칸 버리기
    setLoggedOn(log.loggedOn);
    router.refresh(); // 다른 화면에서 바뀌었을 수도 — DB 값 다시
    // 다시 보일 때만 — 의존값 없음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 서버 값이 바뀌면(저장 · 새로고침) 칸도 그 값으로
  const saved = useMemo(() => JSON.stringify(log), [log]);
  useEffect(() => setLoggedOn(log.loggedOn), [saved, log.loggedOn]); // eslint-disable-line react-hooks/set-state-in-effect

  return (
    <LogReview
      key={`${round}:${saved}`}
      initial={{ ...log, loggedOn: formatKoreanDate(log.loggedOn) }}
      date={<LogDateInput value={loggedOn} today={today} onChange={(v) => setLoggedOn(v || log.loggedOn)} />}
      saveLabel="고친 내용 저장"
      onBack={goBack}
      headerAction={<ShareLog id={log.id} loggedOn={log.loggedOn} shared={log.shared} nick={log.nick} />}
      onSave={async (value) => {
        const res = await updateLog(log.id, {
          loggedOn,
          body: value.body,
          aiStatus: value.aiStatus,
          techniques: value.techniques.map((t) => ({ slug: t.id, level: t.level })),
          customNames: value.customNames,
          terms: value.terms,
          sparringRounds: value.sparringRounds,
        }).catch(() => null);
        if (!res || !res.ok) {
          toast.error(res?.message ?? "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
          return;
        }
        toast.success("고친 내용을 저장했어요");
        forgetPicker(); // 숙련도가 바뀌었다 — 다음 고르기는 새로 받는다
        goBack();
      }}
      onDelete={async () => {
        const res = await deleteLog(log.id).catch(() => null);
        if (!res || !res.ok) {
          toast.error(res?.message ?? "지우지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
          return;
        }
        toast.success("기록을 지웠어요");
        goBack();
      }}
    />
  );
}
