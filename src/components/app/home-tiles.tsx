import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

// 홈 맨 아래 온라인 오픈매트(D-88, 그래픽 D-116). 질문하기는 하단 탭으로 옮겨 타일을 뺐다(D-119).
export function HomeTiles() {
  return (
    <Link
      href="/open-mat"
      className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border transition-colors hover:bg-muted"
    >
      <Users className="size-7 shrink-0" strokeWidth={1.5} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] leading-snug font-semibold">온라인 오픈매트</span>
        <span className="text-[12px] text-muted-foreground">매트에 모여 오스</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
