"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ko } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { LogList } from "@/components/app/log-list";
import { formatKoreanDate } from "@/lib/seoul-date";
import type { LogRow } from "@/lib/logs-data";

// 기록 달력 (D-98) — 한 달 칸, 기록한 날에 점. 날짜를 누르면 그날 기록 줄. 달 넘기기는 주소(?view=cal&m=)로 —
// 누르는 즉시 새 달 칸을 보여 주고 점 · 기록 줄은 불러오는 동안 비워 둔다(2026-10-31).
const toDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function LogsCalendar({ month, rows, today }: { month: string; rows: LogRow[]; today: string }) {
  const router = useRouter();
  const pathname = usePathname(); // /app/logs
  const [, startNav] = useTransition();
  const [shownMonth, setShownMonth] = useOptimistic(month);
  const loading = shownMonth !== month;
  const days = [...new Set(rows.map((r) => r.loggedOn))]; // 최신순
  const [picked, setPicked] = useState<string | null>(days[0] ?? null);
  const sparring = rows.reduce((n, r) => n + r.sparring, 0);
  const dayRows = picked ? rows.filter((r) => r.loggedOn === picked) : [];

  return (
    <section className="flex flex-col gap-3">
      <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
        {loading
          ? "불러오는 중…"
          : rows.length > 0
            ? `이번 달 ${days.length}번 수업${sparring > 0 ? ` · 스파링 ${sparring}판` : ""}`
            : "이 달은 기록이 없어요"}
      </span>
      <div className="rounded-2xl bg-card ring-1 ring-border">
        <Calendar
          mode="single"
          locale={ko}
          showOutsideDays={false}
          month={toDate(`${shownMonth}-01`)}
          onMonthChange={(d) => {
            const next = toIso(d).slice(0, 7);
            startNav(() => {
              setShownMonth(next);
              router.replace(`${pathname}?view=cal&m=${next}`, { scroll: false });
            });
          }}
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
