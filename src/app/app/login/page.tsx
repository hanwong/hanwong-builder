import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LoginButtons } from "@/components/app/login-buttons";

export const metadata: Metadata = { title: "로그인 — Re:Re:롤" };

// 로그인 화면 (FLOW 화면 2): 가운데 카드 하나 · 서비스명 · 한 줄 · 카카오 · 네이버 · Google 버튼(D-66).
export default function LoginPage() {
  return (
    <div className="flex min-h-[70dvh] flex-col justify-center gap-5">
      <Card className="rounded-2xl ring-border">
        <CardContent className="flex flex-col gap-5 py-4">
          <div className="flex flex-col gap-1.5">
            <Image src="/logo.png" alt="" width={48} height={48} className="rounded-xl" priority />
            <span className="text-[22px] font-bold tracking-tight">Re:Re:롤</span>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              오늘 배운 주짓수, 잊지 않게. 기록과 내 기술 목록은 본인만 볼 수 있어요.
            </p>
          </div>
          <Suspense fallback={<div className="h-12 rounded-full bg-muted" aria-hidden />}>
            <LoginButtons />
          </Suspense>
          <p className="text-[13px] font-medium text-muted-foreground">
            로그인한 계정의 이메일만 받아요. 비밀번호는 저장하지 않아요.{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              개인정보처리방침
            </Link>
            {" · "}
            <Link href="/terms" className="underline underline-offset-4">
              서비스 약관
            </Link>
          </p>
        </CardContent>
      </Card>
      <Link href="/" className="self-center text-[13px] font-medium text-muted-foreground underline-offset-4 hover:underline">
        소개 페이지로 돌아가기
      </Link>
    </div>
  );
}
