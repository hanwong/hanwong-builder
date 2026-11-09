"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BeltDot } from "@/components/app/belt-dot";
import { GymHeader } from "@/components/gym/gym-header";
import { BELTS, BELT_RANK } from "@/lib/belt";
import { addDays } from "@/lib/seoul-date";
import type { MembersPage, MemberRow } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

const ROLE_LABEL = { owner: "관장", coach: "코치", member: "관원" } as const;

const PERIODS = [
  { key: "month", label: "이번 달" },
  { key: "last", label: "지난 달" },
  { key: "3m", label: "최근 3개월" },
  { key: "custom", label: "직접" },
] as const;
const SORTS = [
  { key: "recent", label: "최근 출석" },
  { key: "belt", label: "벨트순" },
  { key: "rate", label: "출석률순" },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];
type SortKey = (typeof SORTS)[number]["key"];

type Rated = MemberRow & { came: number; held: number; rate: number | null };

// 기간(시작 · 끝, 둘 다 포함) — 오늘은 서버가 준 서울 날짜(렌더 중 new Date() 금지)
function rangeOf(key: PeriodKey, today: string, custom: { from: string; to: string }): { from: string; to: string } {
  const monthStart = today.slice(0, 7) + "-01";
  if (key === "month") return { from: monthStart, to: today };
  if (key === "last") {
    const lastEnd = addDays(monthStart, -1);
    return { from: lastEnd.slice(0, 7) + "-01", to: lastEnd };
  }
  if (key === "3m") return { from: addDays(today, -89), to: today };
  return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from };
}

// 출석률 = 기간 안 출석한 수업 ÷ 기간 안 내용이 올라간 수업(들어온 날 이후만)
function rate(m: MemberRow, classDates: string[], from: string, to: string): Rated {
  const start = m.joinedOn > from ? m.joinedOn : from;
  const held = classDates.filter((d) => d >= start && d <= to).length;
  const came = m.attended.filter((d) => d >= from && d <= to).length;
  return { ...m, came, held, rate: held > 0 ? Math.min(1, came / held) : null };
}

function sortRows(rows: Rated[], key: SortKey): Rated[] {
  const byName = (a: Rated, b: Rated) => a.nick.localeCompare(b.nick, "ko");
  return [...rows].sort((a, b) => {
    if (key === "belt")
      return (BELT_RANK[b.belt ?? ""] ?? 0) - (BELT_RANK[a.belt ?? ""] ?? 0) || b.stripes - a.stripes || byName(a, b);
    if (key === "rate") return (b.rate ?? -1) - (a.rate ?? -1) || b.came - a.came || byName(a, b);
    return (b.lastAttended ?? "").localeCompare(a.lastAttended ?? "") || byName(a, b);
  });
}

// 관원 목록 (DESIGN '관장님 버전', D-131) — 검색 → 기간 · 정렬 → 코치진 묶음 → 관원 줄(벨트 점 · 이름 · 벨트 그랄 · 기간 출석률 · 마지막 출석)
export function MembersView({ data }: { data: MembersPage }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [sort, setSort] = useState<SortKey>("recent");
  const [custom, setCustom] = useState({ from: data.today.slice(0, 7) + "-01", to: data.today });
  const q = query.trim();
  const { from, to } = rangeOf(period, data.today, custom);

  const rows = useMemo(() => {
    const shown = q ? data.members.filter((m) => m.nick.includes(q)) : data.members;
    return sortRows(
      shown.map((m) => rate(m, data.classDates, from, to)),
      sort,
    );
  }, [data.members, data.classDates, q, from, to, sort]);
  const staff = rows.filter((m) => m.role !== "member");
  const members = rows.filter((m) => m.role === "member");
  const held = data.classDates.filter((d) => d >= from && d <= to).length;
  const rated = members.filter((m) => m.rate !== null);
  const avg = rated.length ? Math.round((rated.reduce((n, m) => n + (m.rate ?? 0), 0) / rated.length) * 100) : null;
  const monthAgo = addDays(data.today, -30);

  return (
    <div className="flex flex-col gap-4">
      <GymHeader gym={data.gym} all={data.all} />
      <h2 className="text-[22px] font-bold tracking-tight">
        관원 <span className="text-[15px] font-medium text-muted-foreground tabular-nums">{data.members.filter((m) => m.role === "member").length}명</span>
      </h2>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 · 닉네임으로 찾기" aria-label="관원 찾기" className="h-11 rounded-full bg-card pl-10 text-[15px]" />
      </div>

      {/* 출석률 기간 */}
      <section className="flex flex-col gap-2" aria-label="출석률 기간">
        <Chips items={PERIODS} value={period} onChange={setPeriod} label="기간" />
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={custom.from}
              max={data.today}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))}
              aria-label="시작 날짜"
              className="h-10 flex-1 rounded-xl text-[15px]"
            />
            <span className="text-muted-foreground">~</span>
            <Input
              type="date"
              value={custom.to}
              max={data.today}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))}
              aria-label="끝 날짜"
              className="h-10 flex-1 rounded-xl text-[15px]"
            />
          </div>
        )}
        <p className="px-1 text-[13px] font-medium text-muted-foreground tabular-nums">
          {fmt(from)} ~ {fmt(to)} · 수업 {held}번{avg !== null && ` · 관원 평균 출석률 ${avg}%`}
        </p>
      </section>

      <Chips items={SORTS} value={sort} onChange={setSort} label="정렬" />

      {staff.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="px-1 text-[13px] font-medium text-muted-foreground">코치진</h3>
          <ul className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {staff.map((m) => (
              <Row key={m.userId} m={m} dim={false} today={data.today} />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-1">
        {staff.length > 0 && <h3 className="px-1 text-[13px] font-medium text-muted-foreground">관원</h3>}
        {members.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-[15px] text-muted-foreground ring-1 ring-border">
            {q ? `'${q}' 에 맞는 관원이 없어요.` : "아직 관원이 없어요. 홈의 가입 코드를 단톡방에 올려 주세요."}
          </p>
        ) : (
          <ul className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {members.map((m) => (
              <Row key={m.userId} m={m} dim={!m.lastAttended || m.lastAttended < monthAgo} today={data.today} />
            ))}
          </ul>
        )}
        <p className="px-1 pt-1 text-[12px] text-muted-foreground">출석률은 기간 안에 내용이 올라간 수업 중 출석한 비율이에요. 들어오기 전 수업은 빼요.</p>
      </section>
    </div>
  );
}

function Chips<K extends string>({ items, value, onChange, label }: { items: readonly { key: K; label: string }[]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <Button
          key={it.key}
          size="sm"
          variant={it.key === value ? "default" : "outline"}
          aria-pressed={it.key === value}
          className="h-8 rounded-full px-3 text-[13px] shadow-none"
          onClick={() => onChange(it.key)}
        >
          {it.label}
        </Button>
      ))}
    </div>
  );
}

function fmt(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}

function daysAgo(iso: string, today: string): string {
  const n = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000);
  return n <= 0 ? "오늘" : n === 1 ? "어제" : `${n}일 전`;
}

function Row({ m, dim, today }: { m: Rated; dim: boolean; today: string }) {
  const b = BELTS.find((x) => x.value === m.belt);
  const beltText = b ? `${b.label}${m.stripes > 0 ? ` ${m.stripes}그랄` : ""}` : "벨트 미정";
  return (
    <li>
      <Link href={`/gym/members/${m.userId}`} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted", dim && "opacity-50")}>
        <BeltDot color={b?.color ?? "#F1F2F0"} belt={b?.value ?? "white"} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 truncate text-[15px] font-medium">
            {m.nick}
            {m.role !== "member" && <Badge variant="secondary">{ROLE_LABEL[m.role]}</Badge>}
          </span>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {beltText} · 출석 {m.came}/{m.held}
            {m.rate !== null && <span className="font-semibold text-foreground"> · {Math.round(m.rate * 100)}%</span>}
          </span>
        </span>
        <span className="text-[13px] text-muted-foreground">{m.lastAttended ? daysAgo(m.lastAttended, today) : "출석 없음"}</span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}
