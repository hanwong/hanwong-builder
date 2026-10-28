"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { finishOnboarding } from "@/app/app/actions";
import { StartMonthPicker } from "@/components/app/start-month-picker";
import { BeltChoice } from "@/components/app/belt-choice";
import { trainingSpan, type Belt } from "@/lib/belt";
import { seoulToday } from "@/lib/seoul-date";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};

// 시작하기 (D-59) — 벨트 색 하나 고르고, 수련 시작 연 · 월(모르면 비워도 됨) → 홈 벨트 위 "수련 N년 N개월째".
export function StartForm() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("next") ?? "/app";
  const next = raw.startsWith("/app") && !raw.startsWith("/app/start") ? raw : "/app";
  const [belt, setBelt] = useState<Belt>("white");
  const [startedOn, setStartedOn] = useState("");
  const [saving, start] = useTransition();
  // 서울 기준 이번 달 — 서버에서는 빈 값, 브라우저에서 채운다(cacheComponents: 렌더 중 new Date() 금지)
  const thisMonth = useSyncExternalStore(noSubscribe, () => seoulToday().slice(0, 7), () => "");
  const valid = !startedOn || (!!thisMonth && startedOn <= thisMonth);

  function done(input: Parameters<typeof finishOnboarding>[0]) {
    start(async () => {
      const res = await finishOnboarding(input).catch(() => null);
      if (!res?.ok) {
        toast.error("저장하지 못했어요. 다시 눌러 주세요.");
        return;
      }
      router.replace(next);
    });
  }

  return (
    <div className="flex min-h-[70dvh] flex-col justify-center gap-5">
      <Card className="rounded-2xl ring-border">
        <CardContent className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Image src="/logo.png" alt="" width={48} height={48} className="rounded-xl" priority />
            <h1 className="text-[22px] font-bold tracking-tight">반가워요!</h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              두 가지만 알려 주세요. 홈의 수련 벨트에 보여 드려요. 나중에 홈에서 언제든 바꿀 수 있어요.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span id="belt-label" className="text-[15px] font-semibold">
              지금 벨트
            </span>
            <BeltChoice value={belt} onChange={setBelt} labelledBy="belt-label" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="started-on-year" className="text-[15px] font-semibold">
              주짓수를 시작한 때
            </Label>
            <StartMonthPicker idPrefix="started-on" value={startedOn} thisMonth={thisMonth} onChange={setStartedOn} />
            <p className={cn("text-[13px] font-medium", valid ? "text-muted-foreground" : "text-destructive")}>
              {!valid
                ? "이번 달까지 고를 수 있어요."
                : startedOn && thisMonth
                  ? `${trainingSpan(startedOn, thisMonth)}로 보여요.`
                  : "연도와 달만 고르면 돼요. 잘 모르겠으면 비워 두세요."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="h-12 w-full rounded-full text-base shadow-none"
              disabled={saving || !valid}
              onClick={() => done({ belt, startedOn: startedOn || null })}
            >
              {saving && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
              시작하기
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-full text-muted-foreground"
              disabled={saving}
              onClick={() => done(null)}
            >
              나중에 할게요
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
