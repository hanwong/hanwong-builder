"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runAgentNow } from "@/app/app/admin/actions";
import { formatKoreanDate } from "@/lib/seoul-date";

export type AgentRun = { runOn: string; status: string; summary: string | null; searches: number };

// 운영 화면 맨 위 — 매일 지도 키우기 에이전트(D-102)가 최근 7일 무엇을 했는지 + 지금 한 번 돌리기
export function AgentRuns({ runs, ranToday }: { runs: AgentRun[]; ranToday: boolean }) {
  const router = useRouter();
  const [running, start] = useTransition();

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[17px] font-semibold">지도 키우기 에이전트</h2>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          매일 새벽 3시 맥의 Claude Code 예약 작업이 어제 질문 · 기록에 적힌 모르는 이름 · 오늘의 포지션을 웹에서 살펴
          기술 초안을 최대 3개 아래 승인 대기에 넣어요. 승인해야 지도에 들어가요. 아래 버튼은 서버에서 API 크레딧으로
          돌려요.
        </p>
      </div>
      {runs.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {runs.map((r) => (
            <li key={r.runOn} className="text-[14px] leading-snug">
              <span className="font-medium tabular-nums">{formatKoreanDate(r.runOn)}</span>
              <span className="text-muted-foreground">
                {" "}
                · {r.status === "running" ? "도는 중…" : (r.summary ?? "")}
                {r.searches > 0 && ` · 검색 ${r.searches}번`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-muted-foreground">아직 돈 적이 없어요.</p>
      )}
      <Button
        variant="outline"
        className="h-10 gap-2 self-start rounded-full shadow-none"
        disabled={running || ranToday}
        onClick={() =>
          start(async () => {
            const res = await runAgentNow().catch(() => null);
            if (res?.ok) toast.success(res.summary ?? "다 돌았어요");
            else toast.error(res?.message ?? "돌리지 못했어요. 잠시 뒤 다시 눌러 주세요.");
            router.refresh();
          })
        }
      >
        {running && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {running ? "살펴보는 중… (1~3분)" : ranToday ? "오늘은 이미 돌았어요" : "지금 한 번 돌리기"}
      </Button>
    </section>
  );
}
