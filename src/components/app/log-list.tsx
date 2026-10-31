import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatKoreanDate } from "@/lib/seoul-date";
import type { LogRow } from "@/lib/logs-data";

// 기록 줄 목록 — 홈 최근 기록 · 기록 목록(D-40)이 함께 쓴다. 누르면 그 기록 보기 · 고치기(D-25).
// 질문(D-101)은 "질문" 배지 + 질문 앞부분, 누르면 질문 다시 보기.
// prefetchAll: 줄이 몇 개뿐일 때 내용까지 미리 받아 둔다(홈 3개, D-39). 긴 목록은 기본값(공용 껍데기만).
export function LogList({ rows, prefetchAll = false }: { rows: LogRow[]; prefetchAll?: boolean }) {
  return (
    <ul className="flex min-w-0 flex-col divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      {rows.map((r) => (
        <li key={r.id} className="min-w-0">
          <Link
            href={r.kind === "question" ? `/app/ask/${r.id}` : `/app/log/${r.id}`}
            prefetch={prefetchAll ? true : undefined}
            className="flex min-w-0 items-center gap-2 px-4 py-3 transition-colors hover:bg-muted"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                {r.kind === "question" && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[12px]">
                    질문
                  </Badge>
                )}
                {formatKoreanDate(r.loggedOn)}
                {r.sparring > 0 && ` · 스파링 ${r.sparring}판`}
              </span>
              {r.kind === "question" ? (
                <span className="truncate text-[15px] font-semibold">{r.excerpt}</span>
              ) : r.names.length > 0 ? (
                <span className="text-[15px] font-semibold">{r.names.join(" · ")}</span>
              ) : r.excerpt ? (
                <span className="truncate text-[15px] text-muted-foreground">{r.excerpt}</span>
              ) : (
                <span className="text-[15px] text-muted-foreground">스파링만 기록</span>
              )}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
