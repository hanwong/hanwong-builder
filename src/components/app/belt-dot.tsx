import { BELT_WHITE_EDGE } from "@/lib/belt";
import { cn } from "@/lib/utils";

// 벨트 색 점 (D-126) — 수련 벨트 색(DESIGN 2). 화이트는 크림 바탕과 구분되게 테두리.
export function BeltDot({ color, belt, className }: { color: string; belt: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-3.5 shrink-0 rounded-full", className)}
      style={{ background: color, boxShadow: belt === "white" ? `inset 0 0 0 1.5px ${BELT_WHITE_EDGE}` : undefined }}
    />
  );
}
