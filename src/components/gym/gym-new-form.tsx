"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGym } from "@/app/gym/actions";
import { NetworkSelect } from "@/components/gym/network-select";

// 체육관 등록 폼 (DESIGN '관장님 버전') — 이름(필수) · 지역 시/구(선택) → "등록" → 체육관 홈(가입 코드 카드)
export function GymNewForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [si, setSi] = useState("");
  const [gu, setGu] = useState("");
  const [network, setNetwork] = useState("");
  const [saving, start] = useTransition();

  function submit() {
    if (!name.trim()) return;
    start(async () => {
      const res = await createGym({ name, si, gu, network }).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "등록하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      toast.success("체육관을 등록했어요");
      router.replace("/gym");
    });
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <header className="flex flex-col gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="홈으로" className="-ml-2 rounded-full">
          <Link href="/app">
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </Link>
        </Button>
        <h1 className="text-[22px] font-bold tracking-tight">체육관 등록</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          관원은 가입 코드로 들어와요. 결제 · 회원 관리 기능은 없어요 — 수업 내용을 올리고 관원들의 수련 기록을 보는 도구예요.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor="gym-name" className="text-[15px] font-semibold">
          체육관 이름
        </Label>
        <Input id="gym-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} placeholder="예: 리리롤 주짓수" className="h-12 rounded-xl text-base" required autoFocus />
      </div>
      <NetworkSelect value={network} onChange={setNetwork} />
      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold">지역 (선택)</span>
        <div className="flex gap-2">
          <Input value={si} onChange={(e) => setSi(e.target.value.slice(0, 20))} placeholder="시 · 도" aria-label="시 · 도" className="h-12 rounded-xl text-base" />
          <Input value={gu} onChange={(e) => setGu(e.target.value.slice(0, 20))} placeholder="구 · 군" aria-label="구 · 군" className="h-12 rounded-xl text-base" />
        </div>
      </div>

      <Button type="submit" disabled={!name.trim() || saving} className="h-12 rounded-full text-base">
        {saving && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
        등록
      </Button>
    </form>
  );
}
