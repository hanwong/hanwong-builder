import Image from "next/image";
import { cn } from "@/lib/utils";

// 포지션 그림(D-52 · D-54) — 같은 포지션 기술은 같은 그림. 그림이 없는 포지션 · 직접 적은 이름이면 그리지 않는다.
export function PositionPicture({ slug, size, className }: { slug?: string | null; size: number; className?: string }) {
  if (!slug) return null;
  return (
    <Image
      src={`/positions/${slug}.png`}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-xl bg-[#FAF9F4] ring-1 ring-border", className)}
    />
  );
}
