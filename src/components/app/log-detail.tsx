"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogReview } from "@/components/app/log-review";
import { ShareLog } from "@/components/app/share-log";
import { deleteLog, updateLog } from "@/app/app/log/actions";
import { formatKoreanDate } from "@/lib/seoul-date";
import { forgetPicker } from "@/lib/picker-store";
import type { SavedLog } from "@/lib/log-data";

// 저장한 기록 보기 · 고치기 (D-25) — 새 기록과 같은 화면(D-56).
export function LogDetail({ log }: { log: SavedLog }) {
  const router = useRouter();
  // 들어온 곳(기록 목록 · 홈 · 기술 상세)으로 돌아간다. 주소로 바로 열어 돌아갈 곳이 없으면 기록 목록으로.
  const goBack = () => (window.history.length > 1 ? router.back() : router.push("/app/logs"));
  return (
    <LogReview
      initial={{ ...log, loggedOn: formatKoreanDate(log.loggedOn) }}
      saveLabel="고친 내용 저장"
      onBack={goBack}
      headerAction={<ShareLog id={log.id} loggedOn={log.loggedOn} />}
      onSave={async (value) => {
        const res = await updateLog(log.id, {
          loggedOn: log.loggedOn,
          body: value.body,
          aiStatus: value.aiStatus,
          techniques: value.techniques.map((t) => ({ slug: t.id, level: t.level })),
          customNames: value.customNames,
          terms: value.terms,
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
