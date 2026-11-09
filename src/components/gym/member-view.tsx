"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Circle, CircleCheck, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BeltDot } from "@/components/app/belt-dot";
import { PositionPicture } from "@/components/app/position-picture";
import { TechniqueModal } from "@/components/gym/technique-modal";
import { BELTS, trainingSpan } from "@/lib/belt";
import { adultBeltOf, type AdultBelt } from "@/lib/adult-belt";
import type { BeltList } from "@/lib/belt-techniques-data";
import type { MemberDetail } from "@/lib/gym-data";
import { LEVELS } from "@/lib/mock/log-seed";
import { formatKoreanDate } from "@/lib/seoul-date";
import { cn } from "@/lib/utils";

const LEVEL_LABEL = new Map(LEVELS.map((l) => [l.value, l.label]));
const ROLE_LABEL = { owner: "관장", coach: "코치", member: "관원" } as const;

// 관원 한 명 (DESIGN '관장님 버전') — 머리 → 숫자 타일 3칸 → 달성도(벨트 탭 · 포지션별 ✓, D-126 과 같은 모양) → 기록 목록
export function MemberView({ data, belts }: { data: MemberDetail; belts: BeltList[] }) {
  const { member, month, logs } = data;
  const b = BELTS.find((x) => x.value === member.belt);
  const [belt, setBelt] = useState<AdultBelt>(adultBeltOf(member.belt));
  const [tech, setTech] = useState<string | null>(null); // 기술 팝업(D-136)
  const list = belts.find((x) => x.belt === belt) ?? belts[0];
  const pct = list.total ? Math.round((list.learned / list.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="관원 목록으로" className="-ml-2 rounded-full">
          <Link href="/gym/members">
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <BeltDot color={b?.color ?? "#F1F2F0"} belt={b?.value ?? "white"} className="size-5" />
          <h1 className="min-w-0 truncate text-[22px] font-bold tracking-tight">{member.nick}</h1>
          {member.role !== "member" && <Badge variant="secondary">{ROLE_LABEL[member.role]}</Badge>}
        </div>
        <p className="text-[13px] font-medium text-muted-foreground">
          {b ? `${b.label} 벨트${member.stripes > 0 ? ` ${member.stripes}그랄` : ""}` : "벨트 미정"}
          {member.startedOn ? ` · ${trainingSpan(member.startedOn, data.thisMonth)}` : ""} · {formatKoreanDate(member.joinedAt.slice(0, 10))} 들어옴
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["이번 달 출석", month.attendance],
          ["이번 달 기록", month.logs],
          ["스파링", month.sparring],
        ].map(([label, n]) => (
          <div key={label} className="flex flex-col rounded-2xl bg-card px-3 py-3 ring-1 ring-border">
            <span className="text-[28px] font-bold leading-none tabular-nums">{n}</span>
            <span className="mt-1 text-[12px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* 달성도 — D-126 벨트 화면과 같은 모양. 관원 본인이 보는 것과 같다 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold">벨트별 흔히 배우는 기술</h2>
        <div role="tablist" aria-label="벨트" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {belts.map((x) => {
            const on = x.belt === belt;
            return (
              <button
                key={x.belt}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setBelt(x.belt)}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
                  on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                <BeltDot color={x.color} belt={x.belt} className="size-3" />
                {x.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[15px] font-semibold">
              <span className="tabular-nums">
                {list.learned}/{list.total}
              </span>
            </p>
            <p className="text-[13px] text-muted-foreground">{pct}%</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="적어 본 기술 비율">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          {list.groups.map((g) => (
            <section key={g.slug} aria-label={g.nameKo}>
              <div className="flex items-center gap-3 px-4 pb-1 pt-3">
                <PositionPicture slug={g.slug} size={28} className="rounded-md" />
                <h3 className="text-[17px] font-semibold">{g.nameKo}</h3>
                <span className="ml-auto text-[13px] font-medium text-muted-foreground tabular-nums">
                  {g.skills.filter((s) => s.learned).length}/{g.skills.length}
                </span>
              </div>
              <ul className="flex flex-col pb-2">
                {g.skills.map((s) => (
                  <li key={s.slug}>
                    <button type="button" onClick={() => setTech(s.slug)} className="flex w-full min-w-0 items-center gap-2.5 px-4 py-2 text-left transition-colors hover:bg-muted">
                      {s.learned ? (
                        <CircleCheck className="size-5 shrink-0 fill-accent text-foreground" strokeWidth={1.75} aria-label="적어 봤음" />
                      ) : (
                        <Circle className="size-5 shrink-0 text-muted-foreground/50" strokeWidth={1.5} aria-hidden />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[15px]">{s.nameKo}</span>
                      {s.count > 0 && <span className="text-[13px] text-muted-foreground tabular-nums">{s.count}번</span>}
                      {s.level && <Badge variant="secondary">{LEVEL_LABEL.get(s.level)}</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      {/* 기록 목록 — 메모까지(D-127) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[17px] font-semibold">
          기록 <span className="text-[13px] font-medium text-muted-foreground">최근 {logs.length}개</span>
        </h2>
        {logs.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-[15px] text-muted-foreground ring-1 ring-border">아직 기록이 없어요.</p>
        ) : (
          <ul className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {logs.map((l) => (
              <li key={l.id} className="border-b border-border last:border-0">
                <Link href={`/gym/members/${member.userId}/log/${l.id}`} className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-muted">
                  <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    {formatKoreanDate(l.loggedOn)}
                    {l.fromClass && <Badge variant="outline">수업 출석</Badge>}
                    {l.comments > 0 && (
                      <span className="ml-auto flex items-center gap-1 tabular-nums">
                        <MessageSquare className="size-3.5" aria-hidden />
                        {l.comments}
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[15px] font-medium">{l.techniques.length ? l.techniques.join(" · ") : l.body.slice(0, 60) || "메모 없음"}</span>
                  {l.techniques.length > 0 && l.body && <span className="truncate text-[13px] text-muted-foreground">{l.body.split("\n")[0]}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <TechniqueModal slug={tech} onClose={() => setTech(null)} />
    </div>
  );
}
