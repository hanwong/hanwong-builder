"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GymHeader } from "@/components/gym/gym-header";
import { cancelClass } from "@/app/gym/actions";
import { WEEKDAY_KO, WEEK_RANGE } from "@/lib/gym-shared";
import type { DaySlot, GymHome } from "@/lib/gym-data";
import { addDays, formatKoreanDate } from "@/lib/seoul-date";
import { cn } from "@/lib/utils";

const shortDate = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8))}`;

// 체육관 홈 (D-127, FLOW 8-3 · DESIGN '관장님 버전') — 주 줄(월~일, ‹ › 로 앞뒤 주 D-134) → 고른 날 수업 카드 → 숫자 → 가입 코드(관장)
export function GymHomeView({ data }: { data: GymHome }) {
  const [day, setDay] = useState(data.today);
  const picked = data.week.find((w) => w.day === day) ?? data.week[0];
  const isToday = picked.day === data.today;
  const off = data.weekOffset;
  const weekLabel = off === 0 ? "이번 주" : off === -1 ? "지난주" : off === 1 ? "다음 주" : off < 0 ? `${-off}주 전` : `${off}주 뒤`;

  return (
    <div className="flex flex-col gap-4">
      <GymHeader gym={data.gym} all={data.all} />

      {/* 주 넘기기 (D-134) — 주소 ?w= 로 앞뒤 주 */}
      <div className="flex items-center gap-1">
        <Button asChild={off > -WEEK_RANGE} variant="ghost" size="icon" aria-label="지난주 보기" className="rounded-full" disabled={off <= -WEEK_RANGE}>
          {off > -WEEK_RANGE ? (
            <Link href={off - 1 === 0 ? "/gym" : `/gym?w=${off - 1}`} scroll={false}>
              <ChevronLeft />
            </Link>
          ) : (
            <ChevronLeft />
          )}
        </Button>
        <span className="flex-1 text-center text-[15px] font-semibold tabular-nums">
          {weekLabel} <span className="text-[13px] font-medium text-muted-foreground">{shortDate(data.week[0].day)} ~ {shortDate(data.week[6].day)}</span>
        </span>
        <Button asChild={off < WEEK_RANGE} variant="ghost" size="icon" aria-label="다음 주 보기" className="rounded-full" disabled={off >= WEEK_RANGE}>
          {off < WEEK_RANGE ? (
            <Link href={off + 1 === 0 ? "/gym" : `/gym?w=${off + 1}`} scroll={false}>
              <ChevronRight />
            </Link>
          ) : (
            <ChevronRight />
          )}
        </Button>
      </div>
      {off !== 0 && (
        <Link href="/gym" scroll={false} className="-mt-2 self-center text-[13px] font-medium text-muted-foreground underline underline-offset-4">
          이번 주로
        </Link>
      )}

      {/* 주 줄 */}
      <div role="tablist" aria-label={weekLabel} className="grid grid-cols-7 gap-1">
        {data.week.map((w) => {
          const on = w.day === picked.day;
          const d = Number(w.day.slice(8));
          return (
            <button
              key={w.day}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setDay(w.day)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[12px] font-medium transition-colors",
                on ? "bg-foreground text-background" : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted",
                w.day === data.today && !on && "ring-foreground",
              )}
            >
              <span>{WEEKDAY_KO[new Date(w.day + "T00:00:00Z").getUTCDay()]}</span>
              <span className={cn("text-[15px] font-semibold tabular-nums", on ? "text-background" : "text-foreground")}>{d}</span>
              <span className="flex h-1.5 gap-0.5">
                {w.slots.map((s) => (
                  <span
                    key={s.key}
                    className={cn(
                      "size-1.5 rounded-full",
                      s.cls?.status === "posted" ? "bg-accent" : on ? "bg-background/50" : "bg-muted-foreground/40",
                    )}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* 고른 날 수업 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold">
          {isToday ? "오늘 수업" : formatKoreanDate(picked.day)}
          {picked.slots.length > 0 && <span className="ml-1.5 text-[13px] font-medium text-muted-foreground">{picked.slots.length}개</span>}
        </h2>
        {picked.slots.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
            <p className="text-[15px] text-muted-foreground">{isToday ? "오늘은 수업이 없어요." : "이날은 수업이 없어요."}</p>
            <div className="flex gap-2">
              {picked.day >= addDays(data.today, -7) && (
                <Button asChild variant="secondary" size="sm" className="rounded-full">
                  <Link href={`/gym/class/new?d=${picked.day}`}>이날 수업 하나 바로 등록</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/gym/schedule">시간표</Link>
              </Button>
            </div>
          </div>
        ) : (
          picked.slots.map((s) => <SlotCard key={s.key} slot={s} gymId={data.gym.id} coachNames={data.coachNames} today={data.today} />)
        )}
      </section>

      {/* 숫자 */}
      <p className="text-[15px] font-semibold tabular-nums">
        관원 {data.members} · {off === 0 ? "이번 주" : "이 주"} 출석 {data.weekAttendance}
      </p>

      {/* 가입 코드 (관장만) */}
      {data.codes && <CodesCard join={data.codes.join} coach={data.codes.coach} />}

      <Link href="/gym/members" className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 text-[15px] font-medium ring-1 ring-border transition-colors hover:bg-muted">
        관원 보기
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>
    </div>
  );
}

function SlotCard({ slot, gymId, coachNames, today }: { slot: DaySlot; gymId: string; coachNames: Record<string, string>; today: string }) {
  const [busy, start] = useTransition();
  const cls = slot.cls;
  const canceled = cls?.status === "canceled";
  const posted = cls?.status === "posted";
  // 앞날짜는 미리 등록 가능(D-134), 지난 수업은 7일 전까지만 등록 · 휴강(DB 정책과 같게)
  const tooOld = slot.heldOn < addDays(today, -7);
  void coachNames;

  function toggleCancel() {
    if (!slot.scheduleId) return;
    start(async () => {
      const res = await cancelClass(gymId, slot.scheduleId!, slot.heldOn, slot.name, slot.startsAt, canceled).catch(() => null);
      if (!res || !res.ok) toast.error(res?.message ?? "바꾸지 못했어요. 다시 눌러 주세요.");
    });
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border", canceled && "opacity-70")}>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[20px] font-bold tabular-nums">{slot.startsAt}</span>
        <span className={cn("truncate text-[15px] font-medium", canceled && "line-through")}>{slot.name}</span>
        {posted && (
          <span className="mt-1 flex flex-wrap items-center gap-1">
            {cls.techniques.slice(0, 3).map((t, i) => (
              <Badge key={i} variant="secondary">
                {t.nameKo}
              </Badge>
            ))}
            {cls.techniques.length > 3 && <span className="text-[12px] text-muted-foreground">+{cls.techniques.length - 3}</span>}
            <span className="text-[13px] text-muted-foreground">출석 {cls.attendance}명</span>
          </span>
        )}
        {canceled && <Badge variant="outline">휴강</Badge>}
      </div>
      {posted ? (
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/gym/class/${cls.id}`}>보기</Link>
        </Button>
      ) : canceled ? (
        <Button variant="ghost" size="sm" className="rounded-full" disabled={busy} onClick={toggleCancel}>
          {busy && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
          휴강 취소
        </Button>
      ) : tooOld ? (
        <span className="text-[13px] text-muted-foreground">지난 수업</span>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <Button asChild size="sm" className="rounded-full">
            <Link href={`/gym/class/new?d=${slot.heldOn}${slot.scheduleId ? `&s=${slot.scheduleId}` : ""}`}>내용 등록</Link>
          </Button>
          {slot.scheduleId && (
            <button type="button" onClick={toggleCancel} disabled={busy} className="text-[12px] text-muted-foreground underline-offset-4 hover:underline">
              휴강
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CodesCard({ join, coach }: { join: string; coach: string }) {
  const [openCoach, setOpenCoach] = useState(false);
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label}를 복사했어요`);
    } catch {
      toast.error("복사하지 못했어요. 길게 눌러 복사해 주세요.");
    }
  }
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-muted/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-medium text-muted-foreground">관원 가입 코드 — 단톡방에 올려 주세요</span>
          <span className="text-[24px] font-bold tracking-[0.3em] tabular-nums">{join}</span>
        </div>
        <Button variant="outline" size="sm" className="rounded-full bg-background" onClick={() => copy(join, "가입 코드")}>
          <Copy data-icon="inline-start" aria-hidden />
          복사
        </Button>
      </div>
      <button type="button" onClick={() => setOpenCoach((v) => !v)} className="flex items-center gap-1 self-start text-[13px] font-medium text-muted-foreground">
        코치 초대 코드
        <ChevronDown className={cn("size-4 transition-transform", openCoach && "rotate-180")} aria-hidden />
      </button>
      {openCoach && (
        <div className="flex items-center gap-3">
          <span className="flex-1 text-[20px] font-bold tracking-[0.3em] tabular-nums">{coach}</span>
          <Button variant="outline" size="sm" className="rounded-full bg-background" onClick={() => copy(coach, "코치 코드")}>
            <Copy data-icon="inline-start" aria-hidden />
            복사
          </Button>
        </div>
      )}
    </section>
  );
}
