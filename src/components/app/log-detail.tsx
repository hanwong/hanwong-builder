"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogReview } from "@/components/app/log-review";
import { updateLog } from "@/app/app/log/actions";
import { formatKoreanDate } from "@/lib/seoul-date";
import type { SavedLog } from "@/lib/log-data";

// 저장한 기록 보기 · 고치기 (D-25) — 정리 완료 화면을 그대로 쓴다.
export function LogDetail({ log }: { log: SavedLog }) {
  const router = useRouter();
  return (
    <LogReview
      initial={{ ...log, loggedOn: formatKoreanDate(log.loggedOn) }}
      saveLabel="고친 내용 저장"
      onBack={() => router.push("/app")}
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
        toast.success(res.newCards > 0 ? `고쳤어요. 복습 카드 ${res.newCards}장이 새로 생겼어요` : "고친 내용을 저장했어요");
        router.push("/app");
      }}
    />
  );
}
