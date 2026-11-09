import Image from "next/image";
import { cn } from "@/lib/utils";
import { GYM_NETWORK_ICONS } from "@/lib/gym-shared";

// 네트워크 표시 (D-128 보강) — 로고가 있으면 로고, 없으면 첫 글자 배지. 이름 옆에 작게 붙는다.
export function NetworkMark({ network, size = 18, className }: { network: string | null | undefined; size?: number; className?: string }) {
  if (!network) return null;
  const file = (GYM_NETWORK_ICONS as Record<string, string | undefined>)[network];
  if (file) {
    return (
      <Image
        src={`/networks/${file}`}
        alt={`${network} 로고`}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-[4px] bg-white object-contain ring-1 ring-border", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[4px] bg-muted text-[10px] font-bold text-muted-foreground ring-1 ring-border", className)}
      style={{ width: size, height: size }}
    >
      {network.trim().charAt(0)}
    </span>
  );
}

// 체육관 이름 표기 (D-146) — 어디서나 "[네트워크 로고] 체육관 이름" 한 가지로. 네트워크 글자는 따로 쓰지 않는다
// (로고의 alt 로만). 네트워크가 없으면 이름만.
export function GymName({
  name,
  network,
  size = 18,
  className,
}: {
  name: string;
  network: string | null | undefined;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <NetworkMark network={network} size={size} />
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
