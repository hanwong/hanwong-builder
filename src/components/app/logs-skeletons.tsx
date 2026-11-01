import { Skeleton } from "@/components/ui/skeleton";

// 기록 탭 자리 — 목록 · 달력(D-98)
export function LogsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-[372px] w-full rounded-2xl" />
    </div>
  );
}
