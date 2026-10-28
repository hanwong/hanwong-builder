import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeData, type HomeData } from "@/lib/home-data";
import { LogList } from "@/components/app/log-list";
import { TrainingBelt } from "@/components/app/training-belt";
import { cookies } from "next/headers";

// 홈 ② 수련 벨트 · ③ 최근 기록 (FLOW 3 · DESIGN 6, 오늘 복습은 D-58 로 뺌). 로그인 쿠키를 읽으므로 page 에서 Suspense 로 감싼다.
export async function HomeSections() {
  // 쿠키 읽기는 try 밖에서 — 미리 만들기(prerender) 중에 Next 가 보내는 "요청 때까지 기다려" 신호를
  // 오류로 잡아 버리면 홈이 "불러오지 못했어요" 로 굳는다
  await cookies();
  let data;
  try {
    data = await getHomeData();
  } catch (e) {
    console.error("home failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/app" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }

  return <HomeView data={data} />;
}

export function HomeView({ data }: { data: HomeData }) {
  const { recent, weeks, belt } = data;

  return (
    <>
      {/* ② 수련 벨트 (D-33) */}
      <TrainingBelt weeks={weeks} belt={belt} />

      {/* ③ 최근 기록 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold">최근 기록</h2>
          {recent.length > 0 && (
            <Link href="/app/logs" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
              전체 보기
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="text-[15px] leading-relaxed text-muted-foreground">첫 수업을 기록하면 여기에 쌓여요.</p>
        ) : (
          <LogList rows={recent} prefetchAll />
        )}
      </section>
    </>
  );
}

// 로딩 — 숫자 · 목록 자리 스켈레톤 (FLOW 3)
export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-14 w-full rounded-[3px]" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-20" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
