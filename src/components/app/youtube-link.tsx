import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

// 유튜브에서 보기 (D-37) — 그 기술 영어 이름 + "bjj" 로 유튜브 검색 결과를 새 창으로 연다.
// 영상을 고르거나 저장하지 않는다(골라 넣기는 M2-02). 유튜브인 게 바로 보이게 유튜브 빨강 알약(D-38, DESIGN 2).
const YOUTUBE_RED = "#FF0033";

export function YoutubeLink({ nameEn, className }: { nameEn: string; className?: string }) {
  const href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nameEn} bjj`)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ backgroundColor: YOUTUBE_RED }}
      className={cn(
        "inline-flex h-7 items-center gap-1 self-start rounded-full px-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90",
        className,
      )}
    >
      <Play className="size-3.5 fill-white" strokeWidth={0} aria-hidden />
      유튜브에서 보기
    </a>
  );
}
