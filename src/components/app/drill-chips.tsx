import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrillChip } from "@/lib/drills-data";

// 기본 드릴 묶음 (D-112, DESIGN '기본 드릴') — 기술 탭 맨 위(한 줄 가로 넘김) · 화이트 벨트 홈(줄바꿈).
export function DrillChips({ drills, wrap = false }: { drills: DrillChip[]; wrap?: boolean }) {
  if (drills.length === 0) return null;
  return (
    <section className="flex flex-col gap-2.5 rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Dumbbell className="size-4" strokeWidth={1.75} aria-hidden />
          기본 드릴
        </h2>
        <span className="text-[13px] font-medium text-muted-foreground">첫 달엔 매일 몇 개씩</span>
      </div>
      <ul
        className={cn(
          "flex gap-1.5",
          wrap ? "flex-wrap" : "-mx-4 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {drills.map((d) => (
          <li key={d.slug} className="shrink-0">
            <Link
              href={`/app/drills/${d.slug}`}
              className="flex h-8 items-center rounded-full border border-border bg-background px-3 text-[13px] font-medium transition-colors hover:bg-muted"
            >
              {d.nameKo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
