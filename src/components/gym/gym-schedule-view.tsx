"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BottomAction } from "@/components/app/bottom-action";
import { GymHeader } from "@/components/gym/gym-header";
import { addSchedule, removeSchedule, updateSchedule } from "@/app/gym/actions";
import { WEEKDAY_KO } from "@/lib/gym-shared";
import type { GymSchedulePage, Schedule } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

const NAMES = ["기본반", "노기", "오픈매트", "유소년", "스파링"];
const LENGTHS = [45, 60, 90, 120];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // 월~일

// 수업 스케줄 (DESIGN '관장님 버전') — 요일 묶음 세로, 줄을 누르면 수정 팝업, 아래 고정 "+ 수업 추가"
export function GymScheduleView({ data }: { data: GymSchedulePage }) {
  const [editing, setEditing] = useState<Schedule | "new" | null>(null);
  const coachName = new Map(data.coaches.map((c) => [c.id, c.nick]));

  return (
    <div className="flex flex-col gap-4">
      <GymHeader gym={data.gym} all={[data.gym]} />
      <h2 className="text-[22px] font-bold tracking-tight">수업 스케줄</h2>
      <p className="text-[13px] leading-relaxed text-muted-foreground">매주 반복되는 수업이에요. 하루 쉬는 날은 홈의 수업 카드에서 &lsquo;휴강&rsquo;으로.</p>

      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        {ORDER.map((wd) => {
          const rows = data.schedules.filter((s) => s.weekday === wd);
          return (
            <section key={wd} className="flex flex-col py-2">
              <h3 className="px-4 pb-1 text-[15px] font-semibold">{WEEKDAY_KO[wd]}요일</h3>
              {rows.length === 0 ? (
                <p className="px-4 pb-1 text-[13px] text-muted-foreground">수업 없음</p>
              ) : (
                rows.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setEditing(s)}
                    className="flex items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <span className="w-14 text-[15px] font-semibold tabular-nums">{s.startsAt}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px]">{s.name}</span>
                      <span className="text-[12px] text-muted-foreground">
                        {s.minutes}분{s.coachId && coachName.get(s.coachId) ? ` · ${coachName.get(s.coachId)}` : ""}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </button>
                ))
              )}
            </section>
          );
        })}
      </div>

      <BottomAction>
        <Button className="h-12 w-full rounded-full text-base" onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" aria-hidden />
          수업 추가
        </Button>
      </BottomAction>

      {editing && <ScheduleDialog gymId={data.gym.id} schedule={editing === "new" ? null : editing} coaches={data.coaches} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ScheduleDialog({
  gymId,
  schedule,
  coaches,
  onClose,
}: {
  gymId: string;
  schedule: Schedule | null;
  coaches: { id: string; nick: string }[];
  onClose: () => void;
}) {
  const [name, setName] = useState(schedule?.name ?? "기본반");
  const [custom, setCustom] = useState(schedule && !NAMES.includes(schedule.name) ? schedule.name : "");
  const [weekdays, setWeekdays] = useState<number[]>(schedule ? [schedule.weekday] : []);
  const [startsAt, setStartsAt] = useState(schedule?.startsAt ?? "20:00");
  const [minutes, setMinutes] = useState(schedule?.minutes ?? 60);
  const [coachId, setCoachId] = useState<string>(schedule?.coachId ?? "");
  const [saving, start] = useTransition();
  const [removing, startRemove] = useTransition();
  const finalName = custom.trim() || name;
  const canSave = finalName.length > 0 && (schedule ? true : weekdays.length > 0) && /^\d{2}:\d{2}$/.test(startsAt);

  function save() {
    start(async () => {
      const res = schedule
        ? await updateSchedule(schedule.id, { name: finalName, startsAt, minutes, coachId: coachId || null }).catch(() => null)
        : await addSchedule(gymId, { name: finalName, weekdays, startsAt, minutes, coachId: coachId || null }).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      toast.success(schedule ? "수업을 고쳤어요" : "수업을 추가했어요");
      onClose();
    });
  }
  function remove() {
    if (!schedule) return;
    startRemove(async () => {
      const res = await removeSchedule(schedule.id).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "없애지 못했어요.");
        return;
      }
      toast.success("앞으로의 수업에서 뺐어요. 지난 수업 내용은 남아요.");
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="flex flex-col gap-4 p-4 sm:max-w-md">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-[17px] font-semibold">{schedule ? "수업 고치기" : "수업 추가"}</DialogTitle>
          <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 rounded-full" onClick={onClose}>
            <X />
          </Button>
        </div>
        <DialogDescription className="sr-only">수업 이름 · 요일 · 시작 시각 · 길이 · 담당 코치를 정해요.</DialogDescription>

        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold">수업 이름</span>
          <div className="flex flex-wrap gap-1.5">
            {NAMES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={!custom && name === n}
                onClick={() => {
                  setName(n);
                  setCustom("");
                }}
                className={cn(
                  "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors",
                  !custom && name === n ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <Input value={custom} onChange={(e) => setCustom(e.target.value.slice(0, 20))} placeholder="직접 입력" aria-label="수업 이름 직접 입력" className="h-11 rounded-xl text-base" />
        </div>

        {!schedule && (
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold">요일</span>
            <div className="grid grid-cols-7 gap-1">
              {ORDER.map((wd) => {
                const on = weekdays.includes(wd);
                return (
                  <button
                    key={wd}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setWeekdays((l) => (on ? l.filter((x) => x !== wd) : [...l, wd]))}
                    className={cn(
                      "h-10 rounded-xl text-[15px] font-medium transition-colors",
                      on ? "bg-foreground text-background" : "bg-card ring-1 ring-border hover:bg-muted",
                    )}
                  >
                    {WEEKDAY_KO[wd]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sch-time" className="text-[15px] font-semibold">
              시작
            </Label>
            <Input id="sch-time" type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="h-11 rounded-xl text-base" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold">길이</span>
            <div className="flex flex-wrap gap-1.5">
              {LENGTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={minutes === m}
                  onClick={() => setMinutes(m)}
                  className={cn(
                    "h-8 rounded-full border px-2.5 text-[13px] font-medium transition-colors",
                    minutes === m ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  {m}분
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sch-coach" className="text-[15px] font-semibold">
            담당 (선택)
          </Label>
          <NativeSelect id="sch-coach" value={coachId} onChange={(e) => setCoachId(e.target.value)} className="h-11 rounded-xl text-base">
            <NativeSelectOption value="">정하지 않음</NativeSelectOption>
            {coaches.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.nick}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="flex items-center gap-2">
          {schedule && (
            <Button variant="ghost" className="rounded-full text-destructive" disabled={removing} onClick={remove}>
              {removing && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
              이 수업 없애기
            </Button>
          )}
          <Button className="ml-auto h-11 rounded-full px-5 text-[15px]" disabled={!canSave || saving} onClick={save}>
            {saving && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
