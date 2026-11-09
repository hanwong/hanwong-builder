import { Skeleton } from "@/components/ui/skeleton";
import { getHomeData, type HomeData } from "@/lib/home-data";
import { TrainingBelt } from "@/components/app/training-belt";
import { JiujitsuMap } from "@/components/app/jiujitsu-map";
import { BeltCard } from "@/components/app/belt-card";
import { SparringTile } from "@/components/app/sparring-tile";
import { HomeTiles } from "@/components/app/home-tiles";
import { GymCard } from "@/components/app/gym-card";
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
  const { weeks, belt, stripes, startedOn, nick, defaultNick, thisMonth, map, sparring, beltProgress, gyms } = data;

  return (
    <>
      {/* ② 수련 벨트 (D-33) */}
      <TrainingBelt weeks={weeks} belt={belt} stripes={stripes} startedOn={startedOn} nick={nick} defaultNick={defaultNick} thisMonth={thisMonth} />

      {/* ②-0 내 체육관 (D-127) — 없으면 들어가기, 있으면 오늘 수업 · 출석 */}
      <GymCard gyms={gyms} />

      {/* ②-1 스파링 (D-64 · D-116) */}
      <SparringTile month={sparring.month} total={sparring.total} />

      {/* ②-2 내 벨트 필수 기술 (D-140) — 지도 위. 기본 드릴은 벨트별 기술의 화이트 벨트 위로 옮김 */}
      <BeltCard progress={beltProgress} title={`${beltProgress.label} 벨트 필수 기술`} />

      {/* ②-2 내 주짓수 지도 (D-60) */}
      <JiujitsuMap map={map} />

      {/* ②-3 오픈매트 타일 (D-88 · D-116) */}
      <HomeTiles />
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
