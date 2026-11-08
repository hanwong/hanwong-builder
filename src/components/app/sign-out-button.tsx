"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// 홈 오른쪽 위 로그아웃 (T-03 · T-34). 서버가 세션을 지우고 랜딩으로 보내는 동안(쿠키 지우기 + Supabase 로그아웃
// + 랜딩 다시 받기) 버튼이 아무 반응이 없어 "안 눌렸나?" 싶었다(2026-11-08 본인 신고) → 누르는 즉시 돌아가는
// 표시와 "로그아웃 중…"으로 바꾸고 두 번 눌리지 않게 잠근다. 실제 로그아웃은 그대로 /auth/signout 폼 전송.
export function SignOutButton() {
  const [pending, setPending] = useState(false);
  return (
    <form action="/auth/signout" method="post" onSubmit={() => setPending(true)}>
      <Button
        variant="ghost"
        size="sm"
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-full text-muted-foreground"
      >
        {pending ? (
          <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
        ) : (
          <LogOut data-icon="inline-start" aria-hidden />
        )}
        {pending ? "로그아웃 중…" : "로그아웃"}
      </Button>
    </form>
  );
}
