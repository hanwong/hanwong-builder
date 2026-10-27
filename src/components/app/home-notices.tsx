import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronRight } from "lucide-react";
import { getHomeNotices } from "@/lib/notices-data";
import { NoticeList } from "@/components/app/notice-list";

// 홈 알림 줄 (D-47). 없으면 아무것도 안 그린다. page 에서 Suspense(fallback 없음)로 감싼다.
export async function HomeNotices() {
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let data;
  try {
    data = await getHomeNotices();
  } catch (e) {
    console.error("notices failed:", e instanceof Error ? e.message : "unknown");
    return null; // 알림은 못 읽어도 홈은 그대로
  }
  if (!data.notices.length && !data.waiting) return null;
  return (
    <div className="flex flex-col gap-2">
      {data.waiting ? (
        <Link
          href="/app/admin"
          className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-[15px] font-medium transition-colors hover:bg-muted"
        >
          목록 추가 대기 {data.waiting}개
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
      ) : null}
      {data.notices.length > 0 && <NoticeList notices={data.notices} />}
    </div>
  );
}
