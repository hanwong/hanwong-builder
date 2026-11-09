"use client";

import { useState } from "react";
import { OptionSelect } from "@/components/ui/select";

// 수련 시작 연 · 월 고르기 (D-59) — 브라우저마다 모양이 다른 month 입력 대신 연도 · 월 두 칸.
// 둘 다 고르면 'YYYY-MM', 아니면 ''. 이번 달 뒤는 못 고른다. 글자 16px — 아이폰이 눌렀을 때 확대하지 않게.

export function StartMonthPicker({
  value,
  thisMonth,
  onChange,
  idPrefix,
}: {
  value: string;
  thisMonth: string; // 'YYYY-MM', 아직 모르면 ''
  onChange: (v: string) => void;
  idPrefix: string;
}) {
  const [year, setYear] = useState(value.slice(0, 4));
  const [month, setMonth] = useState(value.slice(5, 7));
  const thisYear = Number(thisMonth.slice(0, 4)) || 2026;
  const years = Array.from({ length: thisYear - 1979 }, (_, i) => String(thisYear - i));
  const lastMonth = year === thisMonth.slice(0, 4) ? Number(thisMonth.slice(5, 7)) : 12;

  function emit(y: string, m: string) {
    const fixed = m && Number(m) > (y === thisMonth.slice(0, 4) ? Number(thisMonth.slice(5, 7)) : 12) ? "" : m;
    setYear(y);
    setMonth(fixed);
    onChange(y && fixed ? `${y}-${fixed}` : "");
  }

  return (
    <div className="flex gap-2">
      <OptionSelect
        id={`${idPrefix}-year`}
        aria-label="시작한 해"
        className="flex-1"
        placeholder="연도"
        value={year}
        onValueChange={(v) => emit(v, month)}
        options={years.map((y) => ({ value: String(y), label: `${y}년` }))}
      />
      <OptionSelect
        id={`${idPrefix}-month`}
        aria-label="시작한 달"
        className="flex-1"
        placeholder="월"
        value={month}
        onValueChange={(v) => emit(year, v)}
        options={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => ({
          value: m,
          label: `${Number(m)}월`,
          disabled: Number(m) > lastMonth,
        }))}
      />
    </div>
  );
}
