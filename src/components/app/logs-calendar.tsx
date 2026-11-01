"use client";

import { useState, useTransition } from "react";
import { ko } from "react-day-picker/locale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { LogList } from "@/components/app/log-list";
import { loadMonth } from "@/app/app/logs/actions";
import { formatKoreanDate } from "@/lib/seoul-date";
import type { LogRow } from "@/lib/logs-data";

// 기록 달력 (D-98) — 한 달 칸, 기록한 날에 점. 날짜를 누르면 그날 기록 줄.
// 이번 달은 미리 받은 것, 다른 달은 서버 액션으로 받아 두고(한 번 받은 달은 다시 안 받음) 넘기는 즉시 새 달 칸을 보여 준다(D-106).
const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function LogsCalendar({ month, rows, today }: { month: string; rows: LogRow[]; today: string }) {
  const [months, setMonths] = useState<Record<string, LogRow[]>>({ [month]: rows });
  const [shownMonth, setShownMonth] = useState(month);
  const [, startLoad] = useTransition();
  const current = months[shownMonth];
  const loading = !current;
  const monthRows = current ?? [];
  const days = [...new Set(monthRows.map((r) => r.loggedOn))]; // 최신순
  const [pickedState, setPicked] = useState<string | null>(days[0] ?? null);
  const picked = pickedState?.startsWith(shownMonth) ? pickedState : (days[0] ?? null); // 달이 바뀌면 그 달의 마지막 기록 날
  const classes = monthRows.filter((r) => r.kind === "log"); // 수업 합계에 질문은 안 셈(D-101)
  const classDays = new Set(classes.map((r) => r.loggedOn)).size;
  const sparring = classes.reduce((n, r) => n + r.sparring, 0);
  const dayRows = picked ? monthRows.filter((r) => r.loggedOn === picked) : [];

  function changeMonth(d: Date) {
    const next = toIso(d).slice(0, 7);
    setShownMonth(next);
    if (months[next]) return;
    startLoad(async () => {
      const r = await loadMonth(next).catch(() => null);
      if (!r?.ok) {
        toast.error("그 달 기록을 불러오지 못했어요 — 다시 넘겨 주세요.");
        setShownMonth((m) => (m === next ? month : m));
        return;
      }
      setMonths((m) => ({ ...m, [next]: r.rows }));
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
        {loading
          ? "불러오는 중…"
          : monthRows.length > 0
            ? `이번 달 ${[
                classDays > 0 && `${classDays}번 수업`,
                sparring > 0 && `스파링 ${sparring}판`,
                monthRows.length > classes.length && `질문 ${monthRows.length - classes.length}개`,
              ]
                .filter(Boolean)
                .join(" · ")}`
            : "이 달은 기록이 없어요"}
      </span>
      {/* 다른 달을 불러오는 동안 날짜 칸은 흐리게 깜빡이고 가운데 도는 표시 — 달 넘기기 버튼은 그대로 눌린다 */}
      <div className="relative rounded-2xl bg-card ring-1 ring-border" aria-busy={loading || undefined}>
        {loading && (
          <div className="pointer-events-none absolute inset-x-0 top-14 bottom-0 z-30 flex items-center justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              불러오는 중
            </span>
          </div>
        )}
        <Calendar
          mode="single"
          locale={ko}
          showOutsideDays={false}
          month={toDate(`${shownMonth}-01`)}
          onMonthChange={changeMonth}
          endMonth={toDate(today)}
          today={toDate(today)}
          disabled={{ after: toDate(today) }}
          selected={picked && !loading ? toDate(picked) : undefined}
          onSelect={(d) => d && setPicked(toIso(d))}
          modifiers={{ logged: loading ? [] : days.map(toDate) }}
          modifiersClassNames={{
            logged:
              "after:pointer-events-none after:absolute after:bottom-1.5 after:left-1/2 after:z-20 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary data-[selected=true]:after:bg-primary-foreground",
          }}
          className="w-full bg-transparent p-3 [--cell-size:--spacing(11)]"
          classNames={{
            root: "w-full",
            month_grid: cn(
              "rdp-month_grid w-full border-collapse transition-opacity",
              loading && "pointer-events-none animate-pulse opacity-40",
            ),
            caption_label: "text-[15px] font-semibold select-none",
            weekday: "flex-1 text-[13px] font-normal text-muted-foreground select-none",
            today: "rounded-(--cell-radius) ring-1 ring-foreground/40 ring-inset",
          }}
        />
      </div>
      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : (
        picked && (
          <div className="flex flex-col gap-2">
            <h2 className="text-[15px] font-semibold">{formatKoreanDate(picked)}</h2>
            {dayRows.length > 0 ? (
              <LogList rows={dayRows} prefetchAll={dayRows.length <= 3} />
            ) : (
              <p className="text-[15px] text-muted-foreground">이날은 기록이 없어요</p>
            )}
          </div>
        )
      )}
    </section>
  );
}
