"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { attendClass, joinGym, peekGym, type PeekedGym } from "@/app/gym/actions";
import type { MemberGymCard } from "@/lib/gym-data";

// 홈 "내 체육관" (D-127, FLOW 8-3 관원 쪽 · DESIGN '관장님 버전')
// 없음: 들어가기(코드 → 동의 한 장). 있음: 오늘 수업 카드 + "출석 · 내 기록으로"
export function GymCard({ gyms }: { gyms: MemberGymCard[] }) {
  const [joining, setJoining] = useState(false);
  if (gyms.length === 0) {
    return (
      <>
        <section className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <Building2 className="size-7 shrink-0" strokeWidth={1.5} aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] leading-snug font-semibold">내 체육관 들어가기</span>
            <span className="text-[12px] text-muted-foreground">관장님이 올린 수업을 한 번에 기록해요</span>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setJoining(true)}>
            코드 입력
          </Button>
        </section>
        {joining && <JoinDialog onClose={() => setJoining(false)} />}
      </>
    );
  }
  return (
    <>
      {gyms.map((g) => (
        <section key={g.id} className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-muted-foreground">{g.network ? `${g.name} · ${g.network}` : g.name}</span>
            {g.role !== "member" && (
              <Link href="/gym" className="text-[13px] font-medium underline-offset-4 hover:underline">
                관장 화면
              </Link>
            )}
          </div>
          {g.today.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">오늘은 수업이 없어요.</p>
          ) : (
            g.today.map((s) => <TodaySlot key={s.key} slot={s} />)
          )}
        </section>
      ))}
    </>
  );
}

function TodaySlot({ slot }: { slot: MemberGymCard["today"][number] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  function attend() {
    if (!slot.classId) return;
    start(async () => {
      const res = await attendClass(slot.classId!).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "출석하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      toast.success("출석했어요. 내 기록이 생겼어요 — 메모는 내 것으로 고쳐도 돼요.");
      router.push(`/app/log/${res.id}`);
    });
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[15px] font-semibold">
        오늘 수업 · {slot.name} <span className="tabular-nums">{slot.startsAt}</span>
      </p>
      {slot.status === "posted" && slot.techniques.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {slot.techniques.slice(0, 3).map((t, i) => (
            <Badge key={i} variant="secondary">
              {t}
            </Badge>
          ))}
          {slot.techniques.length > 3 && <span className="text-[12px] text-muted-foreground">+{slot.techniques.length - 3}</span>}
        </div>
      )}
      {slot.status === "canceled" ? (
        <p className="text-[13px] text-muted-foreground">오늘 휴강이에요.</p>
      ) : slot.status === "waiting" ? (
        <p className="text-[13px] text-muted-foreground">수업 내용 대기 — 관장님 · 코치가 올리면 여기에 떠요.</p>
      ) : slot.myLogId ? (
        <Button asChild variant="outline" size="sm" className="h-10 self-start rounded-full">
          <Link href={`/app/log/${slot.myLogId}`}>
            <Check data-icon="inline-start" aria-hidden />
            출석했어요 · 내 기록 보기
          </Link>
        </Button>
      ) : (
        <Button size="sm" className="h-10 self-start rounded-full px-4" disabled={busy} onClick={attend}>
          {busy && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
          출석 · 내 기록으로
        </Button>
      )}
    </div>
  );
}

// 코드 입력 → 체육관 확인 → 동의 한 장 → 들어가기 (D-127 — 관장 · 코치가 내 기록을 메모까지 본다)
export function JoinDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [gym, setGym] = useState<PeekedGym | null>(null);
  const [checking, startCheck] = useTransition();
  const [joining, startJoin] = useTransition();

  function check() {
    startCheck(async () => {
      const res = await peekGym(code).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "확인하지 못했어요. 다시 눌러 주세요.");
        return;
      }
      if (!res.gym) {
        toast.error("없는 코드예요. 관장님께 다시 확인해 주세요.");
        return;
      }
      setGym(res.gym);
    });
  }
  function join() {
    startJoin(async () => {
      const res = await joinGym(code).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "들어가지 못했어요. 다시 눌러 주세요.");
        return;
      }
      toast.success(`${gym?.name ?? "체육관"}에 들어갔어요`);
      onClose();
      if (gym?.role === "coach") router.push("/gym");
      else router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="flex flex-col gap-4 p-4 sm:max-w-md">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-[17px] font-semibold">{gym ? "관장님 · 코치가 보는 것" : "내 체육관 들어가기"}</DialogTitle>
          <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 rounded-full" onClick={onClose}>
            <X />
          </Button>
        </div>
        <DialogDescription className="sr-only">체육관 가입 코드를 넣고, 관장님 · 코치가 내 기록을 본다는 안내에 동의하면 들어가요.</DialogDescription>

        {!gym ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="ABC123"
              aria-label="가입 코드 6자리"
              autoCapitalize="characters"
              autoComplete="off"
              inputMode="text"
              className="h-14 rounded-xl text-center text-[24px] font-bold tracking-[0.3em] uppercase"
              autoFocus
            />
            <p className="text-[13px] text-muted-foreground">관장님이 단톡방에 올린 6자리 코드예요.</p>
            <Button type="submit" className="h-12 rounded-full text-base" disabled={code.length !== 6 || checking}>
              {checking && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
              확인
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-[17px] font-semibold">{gym.name}</p>
              {(gym.network || gym.region) && <p className="text-[13px] text-muted-foreground">{[gym.network, gym.region].filter(Boolean).join(" · ")}</p>}
              {gym.role === "coach" && <Badge variant="secondary" className="mt-1">코치로 들어가요</Badge>}
            </div>
            {gym.already ? (
              <p className="text-[15px] text-muted-foreground">이미 이 체육관에 있어요.</p>
            ) : (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
                <li>
                  이 체육관의 관장님 · 코치가 <b>내 수업 기록 전부</b>를 봐요 — 기술 · 출석 · 메모 · 스파링.
                </li>
                <li>관원끼리는 서로 안 보여요.</li>
                <li>언제든 나갈 수 있어요 — 나가면 그 순간부터 안 보여요.</li>
                <li>
                  자세한 내용은{" "}
                  <Link href="/privacy" className="underline underline-offset-4" target="_blank">
                    개인정보처리방침 6
                  </Link>
                </li>
              </ul>
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setGym(null)}>
                그만두기
              </Button>
              {!gym.already && (
                <Button className="ml-auto h-12 rounded-full px-5 text-base" disabled={joining} onClick={join}>
                  {joining && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
                  동의하고 들어가기
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
