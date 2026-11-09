"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BeltDot } from "@/components/app/belt-dot";
import { GymHeader } from "@/components/gym/gym-header";
import { BELTS } from "@/lib/belt";
import { addDays } from "@/lib/seoul-date";
import type { MembersPage, MemberRow } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

const ROLE_LABEL = { owner: "관장", coach: "코치", member: "관원" } as const;

// 관원 목록 (DESIGN '관장님 버전') — 검색 → 코치진 묶음 → 관원 줄(벨트 점 · 닉네임 · 마지막 출석 · 이번 달 출석)
export function MembersView({ data }: { data: MembersPage }) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const shown = useMemo(() => (q ? data.members.filter((m) => m.nick.includes(q)) : data.members), [data.members, q]);
  const staff = shown.filter((m) => m.role !== "member");
  const members = shown.filter((m) => m.role === "member");
  const monthAgo = addDays(data.today, -30);

  return (
    <div className="flex flex-col gap-4">
      <GymHeader gym={data.gym} all={data.all} />
      <h2 className="text-[22px] font-bold tracking-tight">
        관원 <span className="text-[15px] font-medium text-muted-foreground tabular-nums">{data.members.filter((m) => m.role === "member").length}명</span>
      </h2>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="닉네임으로 찾기" aria-label="관원 찾기" className="h-11 rounded-full bg-card pl-10 text-[15px]" />
      </div>

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
      </section>
    </div>
  );
}

function daysAgo(iso: string, today: string): string {
  const n = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000);
  return n <= 0 ? "오늘" : n === 1 ? "어제" : `${n}일 전`;
}

function Row({ m, dim, today }: { m: MemberRow; dim: boolean; today: string }) {
  const b = BELTS.find((x) => x.value === m.belt);
  return (
    <li>
      <Link href={`/gym/members/${m.userId}`} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted", dim && "opacity-50")}>
        <BeltDot color={b?.color ?? "#F1F2F0"} belt={b?.value ?? "white"} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 truncate text-[15px] font-medium">
            {m.nick}
            {m.role !== "member" && <Badge variant="secondary">{ROLE_LABEL[m.role]}</Badge>}
          </span>
          <span className="text-[12px] text-muted-foreground tabular-nums">이번 달 출석 {m.monthAttendance}</span>
        </span>
        <span className="text-[13px] text-muted-foreground">{m.lastAttended ? daysAgo(m.lastAttended, today) : "출석 없음"}</span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}
