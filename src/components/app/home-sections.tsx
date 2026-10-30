import Link from "next/link";
import { ChevronRight, Swords, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeData, type HomeData } from "@/lib/home-data";
import { TrainingBelt } from "@/components/app/training-belt";
import { JiujitsuMap } from "@/components/app/jiujitsu-map";
import { cookies } from "next/headers";

// 홈 ② 수련 벨트 · ③ 내 주짓수 지도 (FLOW 3 · DESIGN 6, 오늘 복습 D-58 · 최근 기록 D-61 로 뺌). 로그인 쿠키를 읽으므로 page 에서 Suspense 로 감싼다.
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
  const { weeks, belt, startedOn, thisMonth, map, sparring } = data;

  return (
    <>
      {/* ② 수련 벨트 (D-33) */}
      <TrainingBelt weeks={weeks} belt={belt} startedOn={startedOn} thisMonth={thisMonth} />

      {/* ②-1 스파링 (D-64) */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          <Swords className="size-4" strokeWidth={1.75} aria-hidden />
          스파링
        </span>
        <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
          이번 달 <span className="text-[15px] font-semibold text-foreground">{sparring.month}판</span> · 전체{" "}
          {sparring.total}판
        </span>
      </div>

      {/* ②-2 내 주짓수 지도 (D-60) */}
      <JiujitsuMap map={map} />

      {/* ②-3 온라인 오픈매트 (D-88) */}
      <Link
        href="/open-mat"
        className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border hover:bg-muted"
      >
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          <Users className="size-4" strokeWidth={1.75} aria-hidden />
          온라인 오픈매트
        </span>
        <span className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
          매트에 모여 오스
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </Link>
    </>
  );
}

// 로딩 — 벨트 · 지도 자리 스켈레톤 (FLOW 3)
export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-14 w-full rounded-[3px]" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
