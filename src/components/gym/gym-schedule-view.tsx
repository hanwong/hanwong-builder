"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogDescription, DialogTitle, ModalBody, ModalContent, ModalFooter } from "@/components/ui/dialog";
import { FloatingAction } from "@/components/app/tab-bar";
import { GymHeader } from "@/components/gym/gym-header";
import { CLASS_BG, ScheduleTable } from "@/components/gym/schedule-table";
import { addSchedule, removeSchedule, setClassColor, updateSchedule } from "@/app/gym/actions";
import { CLASS_COLORS, WEEKDAY_KO, defaultClassColor, type ClassColor } from "@/lib/gym-shared";
import type { GymSchedulePage, Schedule } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

const NEW_NAME = "__new__";
const LENGTHS = [45, 60, 90, 120];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // 월~일

// 수업 스케줄 (DESIGN '관장님 버전') — 시간표(D-135) 하나, 칸을 누르면 수정 팝업, 아래 고정 "+ 수업 추가". 요일별 목록은 뺌(D-137)
export function GymScheduleView({ data }: { data: GymSchedulePage }) {
  const [editing, setEditing] = useState<Schedule | "new" | null>(null);
  // 지금까지 적은 수업 이름(D-137) — 고르기 목록
  const knownNames = [...new Set([...data.schedules.map((s) => s.name), ...Object.keys(data.colors)])].sort((a, b) => a.localeCompare(b, "ko"));

  return (
    <div className="flex flex-col gap-4">
      <GymHeader gym={data.gym} all={[data.gym]} />
      <h2 className="text-[22px] font-bold tracking-tight">수업 스케줄</h2>
      <p className="text-[13px] leading-relaxed text-muted-foreground">매주 반복되는 수업이에요. 하루 쉬는 날은 홈의 수업 카드에서 &lsquo;휴강&rsquo;으로.</p>

      {/* 시간표 (D-135) — 맨 위에 한눈에, 칸을 누르면 고치기 */}
      <ScheduleTable schedules={data.schedules} colors={data.colors} onPick={setEditing} />

      {/* 기록 탭 "+ 기록하기"와 같은 떠 있는 알약(D-148). 아래 칸이 가리지 않게 자리만 비워 둠 */}
      <div className="h-16" aria-hidden />
      <FloatingAction label="수업 추가" onClick={() => setEditing("new")} />

      {editing && (
        <ScheduleDialog
          gymId={data.gym.id}
          schedule={editing === "new" ? null : editing}
          coaches={data.coaches}
          names={knownNames}
          colors={data.colors}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ScheduleDialog({
  gymId,
  schedule,
  coaches,
  names,
  colors,
  onClose,
}: {
  gymId: string;
  schedule: Schedule | null;
  coaches: { id: string; nick: string }[];
  names: string[];
  colors: Record<string, ClassColor>;
  onClose: () => void;
}) {
  // 수업 이름(D-137): 적어 둔 이름에서 고르거나 "새 이름" → 직접 입력. 처음이면 바로 입력
  const [name, setName] = useState(schedule?.name ?? names[0] ?? NEW_NAME);
  const [custom, setCustom] = useState("");
  const colorOf = (n: string): ClassColor => colors[n] ?? defaultClassColor(n);
  const [color, setColor] = useState<ClassColor>(colorOf(schedule?.name ?? names[0] ?? ""));
  const [weekdays, setWeekdays] = useState<number[]>(schedule ? [schedule.weekday] : []);
  const [startsAt, setStartsAt] = useState(schedule?.startsAt ?? "20:00");
  const [minutes, setMinutes] = useState(schedule?.minutes ?? 60);
  const [coachId, setCoachId] = useState<string>(schedule?.coachId ?? "");
  const [saving, start] = useTransition();
  const [removing, startRemove] = useTransition();
  const finalName = name === NEW_NAME ? custom.trim() : name;
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
      // 이름별 색 — 저장된 색과 다르거나 처음 쓰는 이름이면 저장(같은 이름 수업 모두 이 색)
      if (colors[finalName] !== color) {
        const c = await setClassColor(gymId, finalName, color).catch(() => null);
        if (!c || !c.ok) toast.error("수업은 저장했지만 색은 저장하지 못했어요. 다시 골라 주세요.");
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
      <ModalContent>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-[17px] font-semibold">{schedule ? "수업 고치기" : "수업 추가"}</DialogTitle>
          <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 rounded-full" onClick={onClose}>
            <X />
          </Button>
        </div>
        <DialogDescription className="sr-only">수업 이름 · 색 · 요일 · 시작 시각 · 수업 시간 · 담당 코치를 정해요.</DialogDescription>

        <ModalBody>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sch-name" className="text-[15px] font-semibold">
            수업 이름
          </Label>
          {names.length > 0 && (
            <NativeSelect
              id="sch-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value !== NEW_NAME) setColor(colorOf(e.target.value));
              }}
              className="h-11 w-full rounded-xl text-base"
            >
              {names.map((n) => (
                <NativeSelectOption key={n} value={n}>
                  {n}
                </NativeSelectOption>
              ))}
              <NativeSelectOption value={NEW_NAME}>+ 새 이름 직접 입력</NativeSelectOption>
            </NativeSelect>
          )}
          {name === NEW_NAME && (
            <Input
              id={names.length > 0 ? undefined : "sch-name"}
              value={custom}
              onChange={(e) => setCustom(e.target.value.slice(0, 20))}
              placeholder="예: 도복 주짓수"
              aria-label="새 수업 이름"
              className="h-11 rounded-xl text-base"
            />
          )}
        </div>

        {/* 이름별 색(D-137) — 시간표 칸이 이 색으로. 같은 이름 수업 모두 같이 바뀜 */}
        <div className="flex flex-col gap-2">
          <span id="sch-color" className="text-[15px] font-semibold">
            색 <span className="text-[12px] font-medium text-muted-foreground">같은 이름 수업 모두 이 색</span>
          </span>
          <div role="radiogroup" aria-labelledby="sch-color" className="grid grid-cols-8 gap-1.5">
            {CLASS_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={color === c.value}
                aria-label={c.label}
                title={c.label}
                onClick={() => setColor(c.value)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-full ring-1 ring-border transition-shadow",
                  CLASS_BG[c.value],
                  color === c.value && "ring-2 ring-foreground",
                )}
              >
                {color === c.value && <Check className="size-4" strokeWidth={2.5} aria-hidden />}
              </button>
            ))}
          </div>
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="sch-time" className="text-[15px] font-semibold">
            시작 시각
          </Label>
          <Input id="sch-time" type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="h-11 rounded-xl text-base" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold">수업 시간</span>
          <div className="flex flex-wrap gap-1.5">
            {LENGTHS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={minutes === m}
                onClick={() => setMinutes(m)}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-[14px] font-medium transition-colors",
                  minutes === m ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted",
                )}
              >
                {m}분
              </button>
            ))}
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
        </ModalBody>

        <ModalFooter>
          {schedule && (
            <Button variant="ghost" className="rounded-full text-destructive" disabled={removing} onClick={remove}>
              {removing && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
              이 수업 없애기
            </Button>
          )}
          <Button className="h-12 flex-1 rounded-full text-base" disabled={!canSave || saving} onClick={save}>
            {saving && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
            저장
          </Button>
        </ModalFooter>
      </ModalContent>
    </Dialog>
  );
}
