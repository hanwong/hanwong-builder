"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogDescription, DialogTitle, ModalBody, ModalContent, ModalFooter } from "@/components/ui/dialog";
import { OptionSelect } from "@/components/ui/select";
import { GymHeader } from "@/components/gym/gym-header";
import { deleteGym, demoteCoach, leaveGym, regenCode, transferOwner, updateGym } from "@/app/gym/actions";
import type { SettingsPage } from "@/lib/gym-data";
import { NetworkSelect } from "@/components/gym/network-select";

// 체육관 설정 (DESIGN '관장님 버전')
export function GymSettingsView({ data }: { data: SettingsPage }) {
  const router = useRouter();
  const owner = data.gym.role === "owner";
  const [name, setName] = useState(data.gym.name);
  const [region, setRegion] = useState(data.region);
  const [network, setNetwork] = useState(data.network);
  const [codes, setCodes] = useState(data.codes);
  const [transferTo, setTransferTo] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [regenWhich, setRegenWhich] = useState<"join" | "coach" | null>(null);
  const [busy, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message?: string } | null>, done: string) =>
    start(async () => {
      const res = await fn().catch(() => null);
      if (!res || !res.ok) {
        toast.error(("message" in (res ?? {}) && res?.message) || "처리하지 못했어요. 다시 눌러 주세요.");
        return;
      }
      if (done) toast.success(done);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <GymHeader gym={data.gym} all={data.all} />
      <h2 className="text-[22px] font-bold tracking-tight">체육관 설정</h2>

      {owner && (
        <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <h3 className="text-[15px] font-semibold">이름 · 네트워크 · 지역</h3>
          <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} aria-label="체육관 이름" className="h-11 rounded-xl text-base" />
          <NetworkSelect value={network} onChange={setNetwork} id="gym-network-setting" />
          <Input value={region} onChange={(e) => setRegion(e.target.value.slice(0, 41))} placeholder="시 · 도  구 · 군" aria-label="지역" className="h-11 rounded-xl text-base" />
          <Button
            size="sm"
            className="self-end rounded-full"
            disabled={busy || !name.trim()}
            onClick={() => {
              const [si = "", ...rest] = region.trim().split(/\s+/);
              run(() => updateGym(data.gym.id, { name, si, gu: rest.join(" "), network }), "저장했어요");
            }}
          >
            저장
          </Button>
        </section>
      )}

      {codes && (
        <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <h3 className="text-[15px] font-semibold">가입 코드</h3>
          {(["join", "coach"] as const).map((which) => {
            const code = codes[which];
            if (!code) return null; // 코치에게는 관원 코드만(D-161)
            return (
              <div key={which} className="flex items-center gap-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] text-muted-foreground">{which === "join" ? "관원" : "코치"}</span>
                  <span className="text-[20px] font-bold tracking-[0.3em] tabular-nums">{code}</span>
                </span>
                <CopyButton text={code} label={`${which === "join" ? "관원" : "코치"} 코드 복사`} />
                {owner && (
                  <Button variant="outline" size="sm" className="rounded-full" disabled={busy} onClick={() => setRegenWhich(which)}>
                    다시 만들기
                  </Button>
                )}
              </div>
            );
          })}
          {!owner && <p className="text-[13px] text-muted-foreground">관원 코드를 알려 주면 관원이 이 체육관에 들어올 수 있어요.</p>}
        </section>
      )}

      {regenWhich && (
        <RegenCodeDialog
          which={regenWhich}
          busy={busy}
          onClose={() => setRegenWhich(null)}
          onConfirm={() => {
            const which = regenWhich;
            start(async () => {
              const res = await regenCode(data.gym.id, which).catch(() => null);
              if (!res || !res.ok) {
                toast.error("다시 만들지 못했어요.");
                return;
              }
              setCodes((c) => (c ? { ...c, [which]: res.code } : c));
              setRegenWhich(null);
              toast.success("새 코드를 만들었어요. 옛 코드는 바로 안 돼요.");
            });
          }}
        />
      )}

      <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
        <h3 className="text-[15px] font-semibold">코치진</h3>
        <ul className="flex flex-col gap-2">
          {data.staff.map((s) => (
            <li key={s.userId} className="flex items-center gap-2 text-[15px]">
              <span className="min-w-0 flex-1 truncate">{s.nick}</span>
              <Badge variant="secondary">{s.role === "owner" ? "관장" : "코치"}</Badge>
              {owner && s.role === "coach" && (
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" disabled={busy} onClick={() => run(() => demoteCoach(data.gym.id, s.userId), "관원으로 바꿨어요")}>
                  코치 빼기
                </Button>
              )}
            </li>
          ))}
        </ul>
        {owner && (
          <div className="flex items-start gap-2 pt-1">
            <OptionSelect
              value={transferTo}
              onValueChange={setTransferTo}
              aria-label="관장 넘길 사람"
              placeholder="관장 넘기기 — 사람 고르기"
              className="flex-1"
              triggerClassName="h-10 text-[15px]"
              options={[...data.staff.filter((s) => s.role === "coach"), ...data.members].map((p) => ({ value: p.userId, label: p.nick }))}
            />
            <Button variant="outline" size="sm" className="rounded-full" disabled={busy || !transferTo} onClick={() => run(() => transferOwner(data.gym.id, transferTo), "관장을 넘겼어요. 이제 코치예요.")}>
              넘기기
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
        <Link href="/app" className="-mx-1 flex items-center justify-between rounded-lg px-1 py-1 text-[15px] font-medium transition-colors hover:bg-muted">
          수련자 화면으로
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
      </section>

      {/* 체육관 나가기(코치, D-162) — 맨 아래 따로, 확인 창에서 한 번 더 */}
      {!owner && (
        <section className="flex flex-col gap-2 rounded-2xl p-4 ring-1 ring-destructive/30">
          <h3 className="text-[15px] font-semibold text-destructive">체육관 나가기</h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">나가면 이 체육관 관장 화면을 더 볼 수 없어요. 내 기록은 그대로 남아요.</p>
          <Button variant="outline" size="sm" className="self-start rounded-full border-destructive/40 text-destructive" onClick={() => setLeaveOpen(true)}>
            체육관 나가기
          </Button>
        </section>
      )}
      {!owner && leaveOpen && (
        <Dialog open onOpenChange={(o) => !o && !busy && setLeaveOpen(false)}>
          <ModalContent>
            <DialogTitle className="text-[17px] font-semibold">이 체육관에서 나갈까요?</DialogTitle>
            <ModalBody>
              <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground">
                나가면 이 체육관의 시간표 · 관원 · 수업 화면을 더 볼 수 없어요. 내 기록은 그대로 남고, 다시 들어오려면 코치 코드가 필요해요.
              </DialogDescription>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" className="h-11 flex-1 rounded-full text-[15px] shadow-none" disabled={busy} onClick={() => setLeaveOpen(false)}>
                취소
              </Button>
              <Button
                variant="destructive"
                className="h-11 flex-1 rounded-full text-[15px]"
                disabled={busy}
                onClick={() => run(() => leaveGym(data.gym.id).then((r) => (r.ok ? (router.replace("/app"), r) : r)), "체육관에서 나왔어요")}
              >
                {busy && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
                나가기
              </Button>
            </ModalFooter>
          </ModalContent>
        </Dialog>
      )}

      {/* 체육관 지우기(D-137) — 맨 아래 따로. 팝업에서 이름을 똑같이 적어야 삭제 → 경고 · 아니요 / 삭제 */}
      {owner && (
        <section className="flex flex-col gap-2 rounded-2xl p-4 ring-1 ring-destructive/30">
          <h3 className="text-[15px] font-semibold text-destructive">체육관 지우기</h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">시간표 · 수업 내용 · 코멘트가 모두 사라지고 되돌릴 수 없어요.</p>
          <Button variant="outline" size="sm" className="self-start rounded-full border-destructive/40 text-destructive" onClick={() => setDeleteOpen(true)}>
            체육관 지우기
          </Button>
        </section>
      )}
      {owner && deleteOpen && <DeleteGymDialog gymId={data.gym.id} gymName={data.gym.name} onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}

// 복사 — 보통은 clipboard API, 막혀 있으면(앱 안 브라우저 등) 숨긴 글상자를 골라 복사하는 옛 방식으로 한 번 더
async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    ta.remove();
    if (!ok) throw new Error("copy failed");
  }
}

// 코드 복사(D-161) — 누르면 복사하고 잠깐 체크 표시
function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await writeClipboard(text);
      setDone(true);
      toast.success("복사했어요");
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error("복사하지 못했어요. 코드를 길게 눌러 복사해 주세요.");
    }
  }
  return (
    <Button variant="outline" size="sm" className="rounded-full" aria-label={label} onClick={copy}>
      {done ? <Check data-icon="inline-start" aria-hidden /> : <Copy data-icon="inline-start" aria-hidden />}
      복사
    </Button>
  );
}

// 가입 코드 다시 만들기 확인 (D-155) — 옛 코드가 바로 막히므로 한 번 묻는다
function RegenCodeDialog({
  which,
  busy,
  onClose,
  onConfirm,
}: {
  which: "join" | "coach";
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const who = which === "join" ? "관원" : "코치";
  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <ModalContent>
        <DialogTitle className="text-[17px] font-semibold">{who} 코드를 다시 만들까요?</DialogTitle>
        <ModalBody>
          <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground">
            새 코드를 만들면 지금 코드로는 바로 가입할 수 없어요. 이미 가입한 {which === "join" ? "관원은" : "코치는"} 그대로예요.
          </DialogDescription>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" className="h-11 flex-1 rounded-full text-[15px] shadow-none" disabled={busy} onClick={onClose}>
            취소
          </Button>
          <Button className="h-11 flex-1 rounded-full text-[15px]" disabled={busy} onClick={onConfirm}>
            {busy && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
            다시 만들기
          </Button>
        </ModalFooter>
      </ModalContent>
    </Dialog>
  );
}

// 체육관 지우기 팝업(D-137) — ① 체육관 이름을 똑같이 적으면 "삭제"가 켜짐 ② 누르면 경고 + 아니요 / 삭제 ③ 삭제를 누르면 실제로 지움
function DeleteGymDialog({ gymId, gymName, onClose }: { gymId: string; gymName: string; onClose: () => void }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, start] = useTransition();
  const matches = typed.trim() === gymName.trim();

  function remove() {
    start(async () => {
      const res = await deleteGym(gymId).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "지우지 못했어요.");
        return;
      }
      toast.success("체육관을 지웠어요");
      router.replace("/app");
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <ModalContent>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-[17px] font-semibold text-destructive">체육관 지우기</DialogTitle>
          <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 rounded-full" disabled={busy} onClick={onClose}>
            <X />
          </Button>
        </div>
        <ModalBody className="gap-3">
          <DialogDescription className="text-[14px] leading-relaxed text-muted-foreground">
            지우려면 체육관 이름 <strong className="font-semibold text-foreground">{gymName}</strong> 을(를) 똑같이 적어 주세요.
          </DialogDescription>
          <Input
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setConfirming(false);
            }}
            placeholder={gymName}
            aria-label="체육관 이름 확인"
            autoComplete="off"
            className="h-11 rounded-xl text-base"
            disabled={busy}
          />
          {confirming && (
            <p className="rounded-xl bg-muted/60 p-3 text-[15px]">
              체육관을 지우면 시간표 · 수업 내용 · 코멘트가 사라져요. 관원의 기록은 관원 것으로 남아요.
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          {confirming ? (
            <>
              <Button variant="outline" className="h-11 flex-1 rounded-full text-[15px] shadow-none" disabled={busy} onClick={() => setConfirming(false)}>
                아니요
              </Button>
              <Button variant="destructive" className="h-11 flex-1 rounded-full text-[15px]" disabled={busy} onClick={remove}>
                {busy && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
                삭제
              </Button>
            </>
          ) : (
            <Button variant="destructive" className="h-11 w-full rounded-full text-[15px]" disabled={!matches} onClick={() => setConfirming(true)}>
              삭제
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Dialog>
  );
}
