import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ChevronRight, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnswerBody } from "@/components/app/answer-body";
import { DeleteQuestion } from "@/components/app/delete-question";
import { getQuestion, type QuestionView } from "@/lib/ask/ask-data";
import { formatKoreanDate } from "@/lib/seoul-date";

export const metadata: Metadata = {
  title: "질문 — Re:Re:롤",
};

// 질문 다시 보기 (D-100) — 본인 것만(RLS). 질문 · 답 · 답에 나온 기술 카드 · 지우기.
export default function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      }
    >
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await cookies();
  let q: QuestionView | null;
  try {
    q = await getQuestion(id);
  } catch (e) {
    console.error("question failed:", e instanceof Error ? e.message : "unknown");
    return (
      <p role="alert" className="text-[15px] font-medium text-destructive">
        불러오지 못했어요 —{" "}
        <a href={`/app/ask/${id}`} className="underline underline-offset-4">
          새로고침
        </a>
      </p>
    );
  }
  if (!q) notFound();

  return (
    <article className="flex flex-col gap-5 pb-16">
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <Badge variant="secondary" className="h-5 px-1.5 text-[12px]">
            질문
          </Badge>
          {formatKoreanDate(q.askedOn)}
        </span>
        <h1 className="text-[17px] leading-snug font-semibold">{q.question}</h1>
      </div>
      <AnswerBody answer={q.answer} />
      {/* 질문할수록 자라는 지도(D-115) — 지도에 딱 맞는 칸이 없어 합쳐 답했으면(> 줄) 더 분명히 */}
      <p className="flex gap-2 rounded-xl bg-muted px-3 py-2.5 text-[13px] leading-relaxed">
        <Sprout className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        {/^>\s/m.test(q.answer)
          ? "지도에 딱 맞는 칸이 없어 비슷한 항목을 합쳐 답했어요. 이 질문은 오늘 밤 지도 키우기 에이전트가 살펴보고, 빠진 기술이면 조사해서 지도에 바로 더해요."
          : "이 질문은 오늘 밤 지도 키우기 에이전트가 살펴봐요. 질문이 쌓일수록 기술 지도가 넓어지고 답이 더 정확해져요."}
      </p>

      {q.techniques.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold">답에 나온 기술</h2>
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {q.techniques.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/app/skills/${t.slug}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted"
                >
                  <Image
                    src={`/positions/${t.position}.png`}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 shrink-0 rounded-lg object-cover"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-semibold">{t.nameKo}</span>
                    <span className="truncate text-[13px] text-muted-foreground">
                      {t.positionName}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[13px] leading-relaxed text-muted-foreground">
        AI 가 리리롤 기술 지도를 보고 쓴 답이라 틀릴 수 있어요. 오른손잡이 기준이에요. 코치에게 꼭 확인하세요.
      </p>
      <DeleteQuestion id={q.id} />
    </article>
  );
}
