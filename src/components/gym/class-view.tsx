"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BeltDot } from "@/components/app/belt-dot";
import { ClassForm } from "@/components/gym/class-form";
import { deleteClass } from "@/app/gym/actions";
import { BELTS } from "@/lib/belt";
import type { ClassDetail } from "@/lib/gym-data";
import { formatKoreanDate } from "@/lib/seoul-date";

// 등록된 수업 보기 (D-127, FLOW 8-3) — 기술 · 메모 · 출석 명단, "고치기"(이미 가져간 관원 기록은 안 바뀜)
export function ClassView({ data }: { data: ClassDetail }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, start] = useTransition();
  const { cls, attendees } = data;

  if (editing) {
    return (
      <ClassForm
        gym={data.gym}
        initial={{
          id: cls.id,
          scheduleId: cls.scheduleId,
          heldOn: cls.heldOn,
          name: cls.name,
          startsAt: cls.startsAt,
          body: cls.body,
          techniques: cls.techniques.filter((t) => t.slug).map((t) => ({ slug: t.slug!, nameKo: t.nameKo })),
          customNames: cls.techniques.filter((t) => !t.slug).map((t) => t.nameKo),
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  function remove() {
    start(async () => {
      const res = await deleteClass(cls.id).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "지우지 못했어요.");
        return;
      }
      toast.success("수업 내용을 지웠어요. 이미 가져간 관원 기록은 남아요.");
      router.replace("/gym");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center">
          <Button asChild variant="ghost" size="icon" aria-label="체육관 홈으로" className="-ml-2 rounded-full">
            <Link href="/gym">
              <ArrowLeft className="size-5" strokeWidth={1.75} />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto rounded-full" onClick={() => setEditing(true)}>
            고치기
          </Button>
        </div>
        <span className="text-[13px] font-medium text-muted-foreground">
          {data.gym.name} · {formatKoreanDate(cls.heldOn)}
        </span>
        <h1 className="text-[22px] font-bold tracking-tight">
          {cls.name} <span className="tabular-nums">{cls.startsAt}</span>
        </h1>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold">배운 기술</h2>
          <span className="ml-auto text-[13px] font-medium text-muted-foreground tabular-nums">{cls.techniques.length}개</span>
        </div>
        {cls.techniques.length === 0 && <p className="text-[15px] text-muted-foreground">기술 없이 메모만 있는 수업이에요.</p>}
        {cls.techniques.map((t, i) =>
          t.slug ? (
            <Link key={i} href={`/app/skills/${t.slug}`} className="block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <Card className="rounded-2xl ring-border" size="sm">
                <CardContent className="text-[17px] font-semibold">
                  <span className="mark-lime">{t.nameKo}</span>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card key={i} className="rounded-2xl ring-border" size="sm">
              <CardContent className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{t.nameKo}</span>
                <Badge variant="outline">목록에 없는 기술</Badge>
              </CardContent>
            </Card>
          ),
        )}
      </section>

      {cls.body && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold">메모</h2>
          <Card className="rounded-2xl ring-border">
            <CardContent className="text-[15px] leading-relaxed whitespace-pre-wrap">{cls.body}</CardContent>
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-[15px] font-semibold">출석 {attendees.length}명</h2>
        {attendees.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            {cls.heldOn > data.today
              ? "미리 올린 수업이에요 — 수업 날 관원 홈에 카드가 뜨고, 그날부터 출석할 수 있어요."
              : "아직 출석한 관원이 없어요 — 관원 홈에 카드가 떠 있어요."}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {attendees.map((a) => {
              const b = BELTS.find((x) => x.value === a.belt);
              return (
                <li key={a.userId} className="flex items-center gap-2 text-[15px]">
                  <BeltDot color={b?.color ?? "#F1F2F0"} belt={b?.value ?? "white"} />
                  <Link href={`/gym/members/${a.userId}`} className="min-w-0 flex-1 truncate underline-offset-4 hover:underline">
                    {a.nick}
                  </Link>
                  <span className="text-[13px] text-muted-foreground tabular-nums">
                    {new Date(a.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-[12px] text-muted-foreground">고치거나 지워도 이미 출석한 관원의 기록은 바뀌지 않아요.</p>
      {confirm ? (
        <div className="flex items-center gap-2">
          <span className="text-[15px]">이 수업 내용을 지울까요?</span>
          <Button variant="ghost" size="sm" className="ml-auto rounded-full" onClick={() => setConfirm(false)}>
            아니요
          </Button>
          <Button variant="destructive" size="sm" className="rounded-full" disabled={deleting} onClick={remove}>
            {deleting && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
            지우기
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="self-start rounded-full text-destructive" onClick={() => setConfirm(true)}>
          이 수업 내용 지우기
        </Button>
      )}
    </div>
  );
}
