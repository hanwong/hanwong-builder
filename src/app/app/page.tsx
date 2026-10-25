import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// 임시 홈 (T-12 에서 시작하기 버튼이 올 자리). 진짜 홈(복습 N장 · 최근 기록)은 T-21, 로그인은 T-03 에서.
export default function AppHome() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Re:Re:롤</h1>
        <span className="text-[13px] font-medium text-muted-foreground">만드는 중</span>
      </header>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        오늘도 수고했어요. 배운 걸 잊기 전에 적어 둘까요?
      </p>
      <Button asChild className="h-12 w-full rounded-full text-base">
        <Link href="/app/log">
          <Plus data-icon="inline-start" aria-hidden />
          오늘 배운 것 기록하기
        </Link>
      </Button>
      <p className="text-[13px] font-medium text-muted-foreground">
        로그인 · 오늘 복습 · 최근 기록은 다음 태스크에서 붙어요.
      </p>
    </div>
  );
}
