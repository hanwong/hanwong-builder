import Link from "next/link";
import { ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKoreanDate } from "@/lib/seoul-date";
import { getHomeData, type HomeData } from "@/lib/home-data";
import { createSupabaseServer } from "@/lib/supabase/server";

// 홈 ② 오늘 복습 · ③ 최근 기록 (FLOW 3 · DESIGN 6). 로그인 쿠키를 읽으므로 page 에서 Suspense 로 감싼다.
export async function HomeSections() {
  // 쿠키 읽기는 try 밖에서 — 미리 만들기(prerender) 중에 Next 가 보내는 "요청 때까지 기다려" 신호를
  // 오류로 잡아 버리면 홈이 "불러오지 못했어요" 로 굳는다
  const supabase = await createSupabaseServer();
  let data;
  try {
    data = await getHomeData(supabase);
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
  const { dueToday, totalCards, nextDue, recent } = data;

  return (
    <>
      {/* ② 오늘 복습 */}
      <Card className="rounded-2xl ring-border">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-semibold">오늘 복습</h2>
            <span className="text-[22px] font-bold tabular-nums">
              {dueToday > 0 ? <span className="mark-lime">{dueToday}장</span> : "0장"}
            </span>
          </div>
          {dueToday > 0 ? (
            <Button asChild variant="secondary" className="h-11 w-full rounded-full text-[15px]">
              <Link href="/app/review">
                <Layers data-icon="inline-start" aria-hidden />
                복습 시작
              </Link>
            </Button>
          ) : (
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {totalCards === 0
                ? "아직 카드가 없어요. 오늘 배운 걸 기록하면 내일부터 물어볼게요."
                : nextDue
                  ? `오늘 복습할 카드가 없어요. 다음 복습은 ${formatKoreanDate(nextDue)}이에요.`
                  : "오늘 복습할 카드가 없어요."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ③ 최근 기록 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold">최근 기록</h2>
        {recent.length === 0 ? (
          <p className="text-[15px] leading-relaxed text-muted-foreground">첫 수업을 기록하면 여기에 쌓여요.</p>
        ) : (
          <ul className="flex min-w-0 flex-col divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {recent.map((r) => (
              <li key={r.id} className="min-w-0">
                {/* 누르면 그 기록 보기 · 고치기 (D-25) */}
                <Link
                  href={`/app/log/${r.id}`}
                  className="flex min-w-0 items-center gap-2 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-muted-foreground">{formatKoreanDate(r.loggedOn)}</span>
                    {r.names.length > 0 ? (
                      <span className="text-[15px] font-semibold">{r.names.join(" · ")}</span>
                    ) : (
                      <span className="truncate text-[15px] text-muted-foreground">{r.excerpt}</span>
                    )}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// 로딩 — 숫자 · 목록 자리 스켈레톤 (FLOW 3)
export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-20" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
