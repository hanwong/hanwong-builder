import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { BookOpen, ChevronRight, House, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AskForm } from "@/components/app/ask-form";
import { getBetaData } from "@/lib/ask/beta-data";
import { GrowingMap } from "@/components/app/growing-map";
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
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">
        <span className="mark-lime">막힌 장면</span>,<br />
        물어보세요
      </h1>
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
      <AskForm left={data.left} limit={data.limit} compact />
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
