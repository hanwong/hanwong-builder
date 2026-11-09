"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { GymHeader } from "@/components/gym/gym-header";
import { deleteGym, demoteCoach, leaveGym, regenCode, transferOwner, updateGym } from "@/app/gym/actions";
import type { SettingsPage } from "@/lib/gym-data";

// 체육관 설정 (DESIGN '관장님 버전')
export function GymSettingsView({ data }: { data: SettingsPage }) {
  const router = useRouter();
  const owner = data.gym.role === "owner";
  const [name, setName] = useState(data.gym.name);
  const [region, setRegion] = useState(data.region);
  const [codes, setCodes] = useState(data.codes);
  const [transferTo, setTransferTo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
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
          <h3 className="text-[15px] font-semibold">이름 · 지역</h3>
          <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} aria-label="체육관 이름" className="h-11 rounded-xl text-base" />
          <Input value={region} onChange={(e) => setRegion(e.target.value.slice(0, 41))} placeholder="시 · 도  구 · 군" aria-label="지역" className="h-11 rounded-xl text-base" />
          <Button
            size="sm"
            className="self-end rounded-full"
            disabled={busy || !name.trim()}
            onClick={() => {
              const [si = "", ...rest] = region.trim().split(/\s+/);
              run(() => updateGym(data.gym.id, { name, si, gu: rest.join(" ") }), "저장했어요");
            }}
          >
            저장
          </Button>
        </section>
      )}

      {owner && codes && (
        <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <h3 className="text-[15px] font-semibold">가입 코드</h3>
          {(["join", "coach"] as const).map((which) => (
            <div key={which} className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] text-muted-foreground">{which === "join" ? "관원" : "코치"}</span>
                <span className="text-[20px] font-bold tracking-[0.3em] tabular-nums">{codes[which]}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={busy}
                onClick={() =>
                  start(async () => {
                    const res = await regenCode(data.gym.id, which).catch(() => null);
                    if (!res || !res.ok) {
                      toast.error("다시 만들지 못했어요.");
                      return;
                    }
                    setCodes((c) => (c ? { ...c, [which]: res.code } : c));
                    toast.success("새 코드를 만들었어요. 옛 코드는 바로 안 돼요.");
                  })
                }
              >
                다시 만들기
              </Button>
            </div>
          ))}
        </section>
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
          <div className="flex items-center gap-2 pt-1">
            <NativeSelect value={transferTo} onChange={(e) => setTransferTo(e.target.value)} aria-label="관장 넘길 사람" className="h-10 flex-1 rounded-xl text-[15px]">
              <NativeSelectOption value="">관장 넘기기 — 사람 고르기</NativeSelectOption>
              {[...data.staff.filter((s) => s.role === "coach"), ...data.members].map((p) => (
                <NativeSelectOption key={p.userId} value={p.userId}>
                  {p.nick}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button variant="outline" size="sm" className="rounded-full" disabled={busy || !transferTo} onClick={() => run(() => transferOwner(data.gym.id, transferTo), "관장을 넘겼어요. 이제 코치예요.")}>
              넘기기
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
        <Link href="/app" className="text-[15px] font-medium underline-offset-4 hover:underline">
          수련자 화면으로
        </Link>
        {!owner && (
          <Button variant="ghost" size="sm" className="self-start rounded-full text-destructive" disabled={busy} onClick={() => run(() => leaveGym(data.gym.id).then((r) => (r.ok ? (router.replace("/app"), r) : r)), "체육관에서 나왔어요")}>
            이 체육관 나가기
          </Button>
        )}
        {owner &&
          (confirmDelete ? (
            <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
              <p className="text-[15px]">체육관을 지우면 시간표 · 수업 내용 · 코멘트가 사라져요. 관원의 기록은 관원 것으로 남아요.</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setConfirmDelete(false)}>
                  아니요
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-full"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      const res = await deleteGym(data.gym.id).catch(() => null);
                      if (!res || !res.ok) {
                        toast.error(res?.message ?? "지우지 못했어요.");
                        return;
                      }
                      toast.success("체육관을 지웠어요");
                      router.replace("/app");
                    })
                  }
                >
                  {busy && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
                  지우기
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="self-start rounded-full text-destructive" onClick={() => setConfirmDelete(true)}>
              체육관 지우기
            </Button>
          ))}
      </section>
    </div>
  );
}
