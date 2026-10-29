import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// 내 주짓수 지도 (D-60) — 포지션 그림 21칸(D-76). 배운 기술(숙련도가 있는 기술)이 있는 포지션은 진하게 + 개수, 없는 곳은 흐리게.
// 누르면 내 기술 목록에서 그 포지션을 펼친다(#pos-{slug}).
export function JiujitsuMap({ map }: { map: { slug: string; nameKo: string; learned: number }[] }) {
  const reached = map.filter((p) => p.learned > 0).length;
  const total = map.reduce((n, p) => n + p.learned, 0);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="map-title">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="map-title" className="text-[17px] font-semibold">
          내 주짓수 지도
        </h2>
        <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{reached}</span> / {map.length} 포지션 · 배운 기술 {total}개
        </span>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {map.map((p) => {
          const on = p.learned > 0;
          return (
            <li key={p.slug}>
              <Link
                href={`/app/skills#pos-${p.slug}`}
                aria-label={`${p.nameKo} — 배운 기술 ${p.learned}개`}
                className="flex flex-col items-center gap-1 rounded-xl p-0.5 text-center"
              >
                <span className="relative block w-full">
                  <Image
                    src={`/positions/${p.slug}.png`}
                    alt=""
                    width={96}
                    height={96}
                    className={cn(
                      "aspect-square h-auto w-full rounded-xl bg-[#FAF9F4] ring-1 transition-opacity",
                      on ? "ring-foreground/70" : "opacity-30 ring-border grayscale",
                    )}
                  />
                  {on && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground tabular-nums ring-2 ring-background">
                      {p.learned}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "line-clamp-2 text-[11px] leading-tight break-keep",
                    on ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                  )}
                >
                  {p.nameKo}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
