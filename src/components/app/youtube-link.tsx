import { CirclePlay } from "lucide-react";
import { cn } from "@/lib/utils";

// 유튜브에서 보기 (D-37) — 그 기술 영어 이름 + "bjj" 로 유튜브 검색 결과를 새 창으로 연다.
// 영상을 고르거나 저장하지 않는다(골라 넣기는 M2-02).
export function YoutubeLink({ nameEn, className }: { nameEn: string; className?: string }) {
  const href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nameEn} bjj`)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 self-start rounded-full text-[14px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
        className,
      )}
    >
      <CirclePlay className="size-4" strokeWidth={1.75} aria-hidden />
      유튜브에서 보기
    </a>
  );
}
