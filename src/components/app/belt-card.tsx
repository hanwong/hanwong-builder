import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BeltProgress } from "@/lib/belt-techniques-data";
import { BeltDot } from "@/components/app/belt-dot";

// 홈 지도 위 "○○ 벨트 필수 기술" 카드 (D-126 · D-140, 기술 탭에선 뺌 D-142). 누르면 벨트별 기술 화면.
export function BeltCard({ progress, title }: { progress: BeltProgress; title?: string }) {
  const pct = progress.total ? Math.round((progress.learned / progress.total) * 100) : 0;
  return (
    <Link
      href="/app/belts"
      className="flex flex-col gap-2.5 rounded-2xl bg-card px-4 py-3 ring-1 ring-border transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-2">
        <BeltDot color={progress.color} belt={progress.belt} />
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title ?? `${progress.label} 벨트에서 흔히 배우는 기술`}</h2>
        <span className="text-[15px] font-semibold tabular-nums">
          {progress.learned}/{progress.total}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="적어 본 기술 비율">
        <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}
