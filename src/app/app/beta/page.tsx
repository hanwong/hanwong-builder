import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { BookOpen, ChevronRight, House, PenLine, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AskForm } from "@/components/app/ask-form";
import { getBetaData, type Growth } from "@/lib/ask/beta-data";
import { formatKoreanDate } from "@/lib/seoul-date";

export const metadata: Metadata = {
  title: "물어보기 — Re:Re:롤",
};
export const maxDuration = 60; // 질문하기와 같은 서버 기능을 이 화면에서도 부른다

// 질문 메인 시험 홈 (D-115, FLOW `/app/beta`) — 기록 대신 "막힌 장면 물어보기"가 주인공.
// ① 질문 상자 ② 질문할수록 자라는 기술 지도 ③ 내 최근 질문 ④ 기록 · 위키 · 원래 홈. 기존 홈(/app)은 그대로.
export default function BetaHome() {
  return (
    <div className="flex flex-col gap-6 pb-16">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
          <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
          Re:Re:롤
        </span>
        <Badge variant="secondary">시험 중</Badge>
      </header>
      <section className="flex flex-col gap-2">
        <h1 className="text-[24px] font-bold tracking-tight">
          <span className="mark-lime">막힌 장면</span>, 물어보세요
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          포지션 이름을 몰라도 돼요. 상황을 말로 적으면 리리롤 기술 지도에서 찾아 순서 · 흔한 실수 · 막히면 다음 수까지
          답해요.
        </p>
      </section>
      <Suspense fallback={<BetaSkeleton />}>
        <Loader />
      </Suspense>
    </div>
  );
}

async function Loader() {
  await cookies(); // 쿠키 읽기는 try 밖에서 (home-sections 참고)
  let data;
  try {
    data = await getBetaData();
  } catch (e) {
    console.error("beta failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href="/app/beta" className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  return (
    <>
      <AskForm left={data.left} limit={data.limit} />
      {data.growth && <GrowingMap growth={data.growth} myCount={data.myCount} />}
      {data.mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[17px] font-semibold">내 질문</h2>
          <ul className="flex flex-col overflow-hidden rounded-2xl bg-card py-1 ring-1 ring-border">
            {data.mine.map((q) => (
              <li key={q.id} className="min-w-0">
                <Link href={`/app/ask/${q.id}`} className="flex min-w-0 items-center gap-2 px-4 py-2.5 hover:bg-muted">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px]">{q.question}</span>
                    <span className="text-[12px] text-muted-foreground">{formatKoreanDate(q.askedOn)}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <nav className="grid grid-cols-3 gap-2" aria-label="다른 화면">
        <SmallLink href="/app/log" Icon={PenLine} label="수업 기록" />
        <SmallLink href="/wiki" Icon={BookOpen} label="기술 위키" />
        <SmallLink href="/app" Icon={House} label="원래 홈" />
      </nav>
    </>
  );
}

// 질문할수록 자라는 기술 지도(D-115) — 숫자는 map_growth 에서(공용 기술 · 에이전트 실행 기록의 숫자만)
function GrowingMap({ growth, myCount }: { growth: Growth; myCount: number }) {
  const run = growth.lastRun;
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-center gap-2">
        <Sprout className="size-4" strokeWidth={1.75} aria-hidden />
        <h2 className="text-[15px] font-semibold">질문할수록 똑똑해지는 기술 지도</h2>
      </div>
      <p className="flex items-baseline gap-2 tabular-nums">
        <span className="text-[28px] leading-none font-bold">{growth.total}</span>
        <span className="text-[13px] font-medium text-muted-foreground">개 기술</span>
        {growth.added7d > 0 && (
          <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[12px] font-semibold text-accent-foreground">
            최근 7일 +{growth.added7d}
          </span>
        )}
      </p>
      <ol className="flex flex-col gap-1.5 text-[13px] leading-relaxed">
        {[
          "내 질문에 기술 지도를 찾아 답해요",
          "밤마다 지도 키우기 에이전트가 질문을 살펴 지도에 빠진 기술을 찾아요",
          "운영자가 확인하면 지도에 들어가고, 다음 답이 더 정확해져요",
        ].map((s, i) => (
          <li key={s} className="flex gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {run && (
        <p className="rounded-xl bg-muted px-3 py-2 text-[13px] leading-relaxed">
          {formatKoreanDate(run.runOn)} 새벽 — 질문 {run.questions}개를 살펴보고 새 기술 초안 {run.drafted}개를 만들었어요.
          {growth.fromQuestions > 0 && ` 지금까지 질문에서 시작된 기술 ${growth.fromQuestions}개.`}
        </p>
      )}
      {growth.recent.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-muted-foreground">최근 지도에 들어간 기술</span>
          <div className="flex flex-wrap gap-1.5">
            {growth.recent.map((t) => (
              <Link
                key={t.slug}
                href={`/app/skills/${t.slug}`}
                className="h-8 rounded-full border bg-background px-3 text-[13px] leading-8 hover:bg-muted"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {myCount > 0 && (
        <p className="text-[12px] text-muted-foreground">
          지금까지 내 질문 {myCount}개 — 모두 밤마다 지도 키우기에 쓰여요(누가 물었는지는 빼고).
        </p>
      )}
    </section>
  );
}

function SmallLink({ href, Icon, label }: { href: string; Icon: typeof House; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-2xl bg-card py-3 text-[13px] font-medium ring-1 ring-border hover:bg-muted"
    >
      <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      {label}
    </Link>
  );
}

function BetaSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-[22dvh] w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
