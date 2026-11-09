import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// 관장 · 코치가 아닌 사람이 /gym 을 열었을 때 (FLOW 8-3) — 체육관 등록 안내
export function GymEmpty() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <Building2 className="size-7" strokeWidth={1.5} aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-[17px] font-semibold">체육관을 운영하세요?</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          체육관을 등록하면 수업 시간표와 수업 내용을 올리고, 관원들의 수련 기록을 볼 수 있어요. 관원으로 들어가려면 홈에서 가입 코드를 넣어 주세요.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild className="h-11 rounded-full px-5 text-[15px]">
          <Link href="/gym/new">체육관 등록</Link>
        </Button>
        <Button asChild variant="secondary" className="h-11 rounded-full px-5 text-[15px]">
          <Link href="/app">수련자 화면으로</Link>
        </Button>
      </div>
    </div>
  );
}
