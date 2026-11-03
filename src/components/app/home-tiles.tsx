import Link from "next/link";
import { ArrowRight, MessageCircleQuestion, Users } from "lucide-react";

// 홈 아래 두 칸(D-88 오픈매트 · D-115 시험 홈, 그래픽 D-116) — 글 한 줄 대신 아이콘이 큰 정사각 타일 두 개.
export function HomeTiles() {
  return (
    <nav className="grid grid-cols-2 gap-3" aria-label="바로 가기">
      <Link
        href="/app/beta"
        className="flex flex-col gap-3 rounded-2xl bg-foreground p-4 text-background transition-opacity hover:opacity-90"
      >
        <span className="flex items-start justify-between">
          <MessageCircleQuestion className="size-7" strokeWidth={1.5} aria-hidden />
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">베타</span>
        </span>
        <span className="flex flex-col">
          <span className="text-[15px] leading-snug font-semibold">막힌 장면 물어보기</span>
          <span className="text-[12px] opacity-70">질문이 주인공인 새 홈</span>
        </span>
        <ArrowRight className="size-4 self-end opacity-70" aria-hidden />
      </Link>
      <Link
        href="/open-mat"
        className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border transition-colors hover:bg-muted"
      >
        <Users className="size-7" strokeWidth={1.5} aria-hidden />
        <span className="flex flex-col">
          <span className="text-[15px] leading-snug font-semibold">온라인 오픈매트</span>
          <span className="text-[12px] text-muted-foreground">매트에 모여 오스</span>
        </span>
        <ArrowRight className="size-4 self-end text-muted-foreground" aria-hidden />
      </Link>
    </nav>
  );
}
