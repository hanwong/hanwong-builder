"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  attendClass,
  attendSlot,
  joinGym,
  saveClassLog,
  peekGym,
  setGymRealName,
  type PeekedGym,
} from "@/app/gym/actions";
import type { MemberGymCard } from "@/lib/gym-data";
import { NetworkMark } from "@/components/gym/network-mark";
import { useFloatingDialog } from "@/lib/use-floating-dialog";

// 홈 "내 체육관" (D-127, FLOW 8-3 관원 쪽 · DESIGN '관장님 버전')
// 없음: 들어가기(코드 → 동의 한 장). 있음: 오늘 수업 카드 + "출석 · 내 기록으로"
export function GymCard({ gyms }: { gyms: MemberGymCard[] }) {
  const [joining, setJoining] = useState(false);
  if (gyms.length === 0) {
    return (
      <>
        <section className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <Building2
            className="size-7 shrink-0"
            strokeWidth={1.5}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] leading-snug font-semibold">
              내 체육관 들어가기
            </span>
            <span className="text-[12px] text-muted-foreground">
              관장님이 올린 수업을 한 번에 기록해요
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setJoining(true)}
          >
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
        <section
          key={g.id}
          className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border"
        >
          <div className="flex items-center gap-2">
            <Building2
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-[13px] font-medium text-muted-foreground">
              {g.name}
              {g.network && (
                <>
                  · <NetworkMark network={g.network} size={16} /> {g.network}
                </>
              )}
            </span>
            {g.role !== "member" && (
              <Link
                href="/gym"
                className="text-[13px] font-medium underline-offset-4 hover:underline"
              >
                관장 화면
              </Link>
            )}
          </div>
          {g.needsRealName && <RealNameRow gymId={g.id} />}
          {g.today.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              오늘은 수업이 없어요.
            </p>
          ) : (
            <>
              {/* "오늘 수업"은 위에 한 번만(D-138), 아래로 수업마다 이름 · 시각 */}
              <h3 className="text-[13px] font-medium text-muted-foreground">오늘 수업</h3>
              <div className="flex flex-col divide-y divide-border">
                {g.today.map((s) => (
                  <div key={s.key} className="py-2.5 first:pt-0 last:pb-0">
                    <TodaySlot slot={s} gymId={g.id} gymName={g.name} />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ))}
    </>
  );
}

// 오늘 수업 한 줄(D-138 · D-139) — 이름 · 시각 · 기술 배지. 내용이 올라온 수업은 오른쪽 화살표 → 누르면 수업 내용 팝업
function TodaySlot({ slot, gymId, gymName }: { slot: MemberGymCard["today"][number]; gymId: string; gymName: string }) {
  const [open, setOpen] = useState(false);
  const posted = slot.status === "posted" && !!slot.classId;
  // 내용이 없어도(대기) 화살표 → 팝업에서 출석만(D-143). 휴강 · 규칙 없는 칸은 누를 게 없음
  const tappable = posted || (slot.status === "waiting" && !!slot.scheduleId);
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-[15px] font-semibold">
          {slot.name} <span className="tabular-nums">{slot.startsAt}</span>
        </span>
        {posted && slot.techniques.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {slot.techniques.slice(0, 3).map((t, i) => (
              <Badge key={i} variant="secondary">
                {t}
              </Badge>
            ))}
            {slot.techniques.length > 3 && <span className="text-[12px] text-muted-foreground">+{slot.techniques.length - 3}</span>}
          </span>
        )}
        {slot.status === "canceled" && <span className="text-[13px] text-muted-foreground">오늘 휴강이에요.</span>}
        {tappable && (slot.attended || slot.myLogId) && (
          <span className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
            <Check className="size-3.5" aria-hidden />
            {slot.attended ? "출석했어요" : "내 기록에 저장했어요"}
          </span>
        )}
      </span>
      {tappable && <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
    </>
  );
  if (!tappable) return <div className="flex items-start gap-2">{body}</div>;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${slot.name} ${slot.startsAt} ${posted ? "수업 내용 보기" : "출석"}`}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-xl px-2 py-1 text-left transition-colors hover:bg-muted"
      >
        {body}
      </button>
      {open && <ClassContentDialog slot={slot} gymId={gymId} gymName={gymName} onClose={() => setOpen(false)} />}
    </>
  );
}

// 수업 내용 팝업(D-139) — 기술 · 메모를 읽고, 아래 고정 영역(기술 고르기 팝업처럼)에서
// "내 기록에 저장"(기록만, 출석 ✗) 또는 "출석 + 저장"
function ClassContentDialog({ slot, gymId, gymName, onClose }: { slot: MemberGymCard["today"][number]; gymId: string; gymName: string; onClose: () => void }) {
  const router = useRouter();
  const floating = useFloatingDialog(true);
  const [busy, setBusy] = useState<"save" | "attend" | null>(null);
  const [, start] = useTransition();
  const posted = slot.status === "posted" && !!slot.classId;

  function run(kind: "save" | "attend") {
    if (!slot.classId) return;
    setBusy(kind);
    start(async () => {
      const res = await (kind === "save" ? saveClassLog(slot.classId!) : attendClass(slot.classId!)).catch(() => null);
      setBusy(null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      toast.success(kind === "save" ? "내 기록에 저장했어요 — 출석은 하지 않았어요." : "출석했어요. 내 기록이 생겼어요 — 메모는 내 것으로 고쳐도 돼요.");
      router.push(`/app/log/${res.id}`);
    });
  }
  // 내용 없는 수업 출석(D-143) — 출석만, 기록은 안 생김
  function attendOnly() {
    if (!slot.scheduleId) return;
    setBusy("attend");
    start(async () => {
      const res = await attendSlot(gymId, slot.scheduleId!).catch(() => null);
      setBusy(null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "출석하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      toast.success("출석했어요. 수업 내용이 올라오면 내 기록에 저장할 수 있어요.");
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        style={{ ...floating, display: "flex", flexDirection: "column", gap: "12px", padding: "14px", overscrollBehavior: "contain" }}
      >
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[13px] font-medium text-muted-foreground">{gymName} · 오늘</span>
            <DialogTitle className="text-[20px] font-bold tracking-tight">
              {slot.name} <span className="tabular-nums">{slot.startsAt}</span>
            </DialogTitle>
          </div>
          <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 rounded-full" disabled={!!busy} onClick={onClose}>
            <X />
          </Button>
        </div>
        <DialogDescription className="sr-only">관장님 · 코치가 올린 오늘 수업 내용이에요.</DialogDescription>

        {/* 내용 — 길면 이 안에서만 스크롤 */}
        {!posted ? (
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            아직 수업 내용이 올라오지 않았어요. 출석만 먼저 할 수 있어요 — 내용이 올라오면 여기서 내 기록에 저장할 수 있어요.
          </p>
        ) : (
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-1">
          <section className="flex flex-col gap-2">
            <h3 className="text-[15px] font-semibold">
              배운 기술 <span className="text-muted-foreground tabular-nums">{slot.techniques.length}</span>
            </h3>
            {slot.techniques.length === 0 ? (
              <p className="text-[14px] text-muted-foreground">기술 없이 메모만 있는 수업이에요.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {slot.techniques.map((t, i) => (
                  <li key={i} className="rounded-xl bg-muted/60 px-3 py-2.5 text-[15px] font-semibold">
                    <span className="mark-lime">{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {slot.body && (
            <section className="flex flex-col gap-2">
              <h3 className="text-[15px] font-semibold">메모</h3>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{slot.body}</p>
            </section>
          )}
        </div>
        )}

        {/* 아래 고정 — 기술 고르기 팝업과 같은 자리 */}
        <div className="flex shrink-0 gap-2">
          {!posted ? (
            // 내용 없음 — 출석 버튼만(D-143)
            <Button className="h-12 flex-1 rounded-full text-base shadow-none" disabled={!!busy || slot.attended} onClick={attendOnly}>
              {busy === "attend" && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
              {slot.attended ? (
                <>
                  <Check data-icon="inline-start" aria-hidden />
                  출석했어요
                </>
              ) : (
                "출석"
              )}
            </Button>
          ) : slot.attended && !slot.myLogId ? (
            // 내용 없을 때 먼저 출석 → 이제 내용이 올라옴: 같은 출석에 기록만 붙인다
            <Button className="h-12 flex-1 rounded-full text-base shadow-none" disabled={!!busy} onClick={() => run("attend")}>
              {busy === "attend" && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
              내 기록에 저장
            </Button>
          ) : slot.attended && slot.myLogId ? (
            <Button asChild className="h-12 flex-1 rounded-full text-base shadow-none">
              <Link href={`/app/log/${slot.myLogId}`}>
                <Check data-icon="inline-start" aria-hidden />
                출석했어요 · 내 기록 보기
              </Link>
            </Button>
          ) : (
            <>
              {slot.myLogId ? (
                <Button asChild variant="outline" className="h-12 flex-1 rounded-full text-base shadow-none">
                  <Link href={`/app/log/${slot.myLogId}`}>내 기록 보기</Link>
                </Button>
              ) : (
                <Button variant="outline" className="h-12 flex-1 rounded-full text-base shadow-none" disabled={!!busy} onClick={() => run("save")}>
                  {busy === "save" && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
                  내 기록에 저장
                </Button>
              )}
              <Button className="h-12 flex-1 rounded-full text-base shadow-none" disabled={!!busy} onClick={() => run("attend")}>
                {busy === "attend" && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
                {slot.myLogId ? "출석하기" : "출석 + 저장"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 본명을 안 적은 사람(D-130 전에 들어온 관원 · 코치) — 카드 안 한 줄로 적게 한다
function RealNameRow({ gymId }: { gymId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await setGymRealName(gymId, name).catch(() => null);
          if (!res || !res.ok) {
            toast.error(
              res && "message" in res
                ? res.message
                : "저장하지 못했어요. 다시 눌러 주세요.",
            );
            return;
          }
          toast.success("본명을 저장했어요");
          router.refresh();
        });
      }}
    >
      <p className="text-[13px] leading-relaxed">
        관장님이 알아볼 수 있게 본명을 적어 주세요. 관장님 · 코치만 봐요.
      </p>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          placeholder="본명"
          aria-label="본명"
          autoComplete="name"
          className="h-10 flex-1 rounded-xl text-base"
        />
        <Button
          type="submit"
          size="sm"
          className="h-10 rounded-full px-4"
          disabled={busy || !name.trim()}
        >
          {busy && (
            <Loader2
              data-icon="inline-start"
              className="animate-spin"
              aria-hidden
            />
          )}
          저장
        </Button>
      </div>
    </form>
  );
}

// 코드 입력 → 체육관 확인 → 동의 한 장 → 들어가기 (D-127 — 관장 · 코치가 내 기록을 메모까지 본다)
export function JoinDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [realName, setRealName] = useState("");
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
      const res = await joinGym(code, realName).catch(() => null);
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
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-4 p-4 sm:max-w-md"
      >
        <div className="flex items-center justify-between">
          <DialogTitle className="text-[17px] font-semibold">
            {gym ? "관장님 · 코치가 보는 것" : "내 체육관 들어가기"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            aria-label="닫기"
            className="-mr-1 rounded-full"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        <DialogDescription className="sr-only">
          체육관 가입 코드를 넣고, 관장님 · 코치가 내 기록을 본다는 안내에
          동의하면 들어가요.
        </DialogDescription>

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
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6),
                )
              }
              placeholder="ABC123"
              aria-label="가입 코드 6자리"
              autoCapitalize="characters"
              autoComplete="off"
              inputMode="text"
              className="h-14 rounded-xl text-center text-[24px] font-bold tracking-[0.3em] uppercase"
              autoFocus
            />
            <p className="text-[13px] text-muted-foreground">
              관장님이 단톡방에 올린 6자리 코드예요.
            </p>
            <Button
              type="submit"
              className="h-12 rounded-full text-base"
              disabled={code.length !== 6 || checking}
            >
              {checking && (
                <Loader2
                  data-icon="inline-start"
                  className="animate-spin"
                  aria-hidden
                />
              )}
              확인
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-[17px] font-semibold">{gym.name}</p>
              {(gym.network || gym.region) && (
                <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
                  <NetworkMark network={gym.network} size={16} />
                  {[gym.network, gym.region].filter(Boolean).join(" · ")}
                </p>
              )}
              {gym.role === "coach" && (
                <Badge variant="secondary" className="mt-1">
                  코치로 들어가요
                </Badge>
              )}
            </div>
            {gym.already ? (
              <p className="text-[15px] text-muted-foreground">
                이미 이 체육관에 있어요.
              </p>
            ) : (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
                <li>
                  이 체육관의 관장님 · 코치가 <b>내 수업 기록 전부</b>를 봐요 —
                  기술 · 출석 · 메모 · 스파링.
                </li>
                <li>
                  아래 적는 <b>본명</b>은 관장님 · 코치만 봐요. 다른 관원에게는
                  안 보여요.
                </li>
                <li>관원끼리는 서로 안 보여요.</li>
                <li>언제든 나갈 수 있어요 — 나가면 그 순간부터 안 보여요.</li>
                <li>
                  자세한 내용은{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4"
                    target="_blank"
                  >
                    개인정보처리방침 6
                  </Link>
                </li>
              </ul>
            )}
            {!gym.already && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="gym-real-name"
                  className="text-[15px] font-semibold"
                >
                  본명
                </label>
                <Input
                  id="gym-real-name"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value.slice(0, 20))}
                  placeholder="예: 김한웅"
                  autoComplete="name"
                  className="h-12 rounded-xl text-base"
                />
                <p className="text-[12px] text-muted-foreground">
                  관장님이 출석 명단에서 알아볼 수 있게 실제 이름을 적어 주세요.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setGym(null)}
              >
                그만두기
              </Button>
              {!gym.already && (
                <Button
                  className="ml-auto h-12 rounded-full px-5 text-base"
                  disabled={joining || !realName.trim()}
                  onClick={join}
                >
                  {joining && (
                    <Loader2
                      data-icon="inline-start"
                      className="animate-spin"
                      aria-hidden
                    />
                  )}
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
