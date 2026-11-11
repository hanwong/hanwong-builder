import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { LogsList } from "@/components/app/logs-list";
import { LogsSkeleton } from "@/components/app/logs-skeletons";
import { getLogs } from "@/lib/logs-data";

export const metadata: Metadata = {
  title: "기록 — Re:Re:Roll",
};

// 기록 목록 (T-33, D-40) — 하단 '기록' 탭. 최신순 20개를 미리 받아 두고, 끝에 가까워지면 서버 액션으로 이어 받는다(D-106 · D-111).
export default function LogsPage() {
  return (
    <Suspense fallback={<LogsSkeleton />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let data;
  try {
    data = await getLogs();
  } catch (e) {
    console.error("logs failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/app/logs" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }

  if (data.total === 0) {
    return (
      <p className="text-[15px] leading-relaxed text-muted-foreground">아직 기록이 없어요. 첫 수업을 기록해 보세요.</p>
    );
  }
  // 저장 · 지우기로 목록이 바뀌면(revalidatePath) 더 보기로 이어 붙인 것도 처음부터
  return <LogsList key={`${data.total}-${data.rows[0]?.id}`} initial={data.rows} total={data.total} />;
}
