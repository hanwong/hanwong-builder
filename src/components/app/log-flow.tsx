"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PencilLine, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogEditor } from "@/components/app/log-editor";
import { formatKoreanDate } from "@/lib/seoul-date";
import { LogReview } from "@/components/app/log-review";
import { organizeLog, saveLog } from "@/app/app/log/actions";
import type { MatchedTechnique, Term } from "@/lib/mock/log-seed";

// 오늘 배운 것 기록 — 한 화면 3상태 (FLOW 4).
// A 쓰기 → "정리하기" → B 정리 중(글 그대로 + 아래 스켈레톤) → C 확인.
// B 에서 실패하면 "다시 시도 / 그냥 저장"(그냥 저장 = 기술 없이 C 로, 이름은 직접 적을 수 있음).
type Draft = { body: string; loggedOn: string };
type Review = Draft & { isMock: boolean; techniques: MatchedTechnique[]; terms: Term[]; skipped?: boolean };

type State =
  | { step: "write"; draft: Draft }
  | { step: "organizing"; draft: Draft }
  | { step: "failed"; draft: Draft; message: string }
  | { step: "review"; review: Review };

export function LogFlow() {
  const [state, setState] = useState<State>({ step: "write", draft: { body: "", loggedOn: "" } });
  const router = useRouter();

  async function organize(draft: Draft) {
    setState({ step: "organizing", draft });
    const res = await organizeLog(draft.body).catch(() => null);
    if (!res || !res.ok) {
      setState({
        step: "failed",
        draft,
        message: res?.message ?? "인터넷 연결을 확인하고 다시 시도해 주세요.",
      });
      return;
    }
    setState({ step: "review", review: { ...draft, isMock: res.isMock, techniques: res.techniques, terms: res.terms } });
  }

  if (state.step === "review") {
    const { review } = state;
    return (
      <LogReview
        initial={{
          loggedOn: formatKoreanDate(review.loggedOn),
          body: review.body,
          techniques: review.techniques,
          customNames: [],
          terms: review.terms,
          aiStatus: review.skipped ? "none" : review.isMock ? "mock" : "ok",
          skipped: review.skipped,
        }}
        onBack={() => setState({ step: "write", draft: { body: review.body, loggedOn: review.loggedOn } })}
        onSave={async (value) => {
          const res = await saveLog({
            loggedOn: review.loggedOn,
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
          toast.success(
            res.newCards > 0
              ? `복습 카드 ${res.newCards}장 생겼어요. 내일부터 물어볼게요`
              : res.linked > 0
                ? "기록을 저장했어요. 이미 있던 복습 카드는 그대로예요"
                : "기록을 저장했어요",
          );
          router.push("/app");
        }}
      />
    );
  }

  const { draft } = state;
  const locked = state.step !== "write";

  return (
    <LogEditor
      // 다시 쓰기로 돌아올 때 글 · 날짜를 그대로 살린다
      key={locked ? "locked" : "write"}
      initialBody={draft.body}
      initialDate={draft.loggedOn || undefined}
      locked={locked}
      onSubmit={organize}
      below={
        state.step === "organizing" ? (
          <OrganizingSkeleton />
        ) : state.step === "failed" ? (
          <div className="flex flex-col items-start gap-1">
            <p role="alert" className="text-[15px] leading-relaxed font-medium text-destructive">
              정리에 실패했어요. {state.message}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 rounded-full text-muted-foreground"
              onClick={() => setState({ step: "write", draft })}
            >
              <PencilLine data-icon="inline-start" aria-hidden />
              글 고치기
            </Button>
          </div>
        ) : null
      }
      footer={
        state.step === "organizing" ? (
          <Button disabled className="h-12 w-full rounded-full text-base shadow-none">
            <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
            정리 중…
          </Button>
        ) : state.step === "failed" ? (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-12 flex-1 rounded-full text-base shadow-none"
              onClick={() =>
                setState({
                  step: "review",
                  review: { ...draft, isMock: false, techniques: [], terms: [], skipped: true },
                })
              }
            >
              그냥 저장
            </Button>
            <Button className="h-12 flex-1 rounded-full text-base shadow-none" onClick={() => organize(draft)}>
              <RotateCcw data-icon="inline-start" aria-hidden />
              다시 시도
            </Button>
          </div>
        ) : undefined
      }
    />
  );
}

// 상태 B — 기술 카드 자리 2장 + "정리하는 중…" (DESIGN 6)
function OrganizingSkeleton() {
  return (
    <section className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <p className="text-[13px] font-medium text-muted-foreground">
        글에서 배운 기술을 찾는 중이에요. 몇 초 걸려요…
      </p>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-4 w-3/5" />
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-8 w-12 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
