"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogList } from "@/components/app/log-list";
import { loadMoreLogs } from "@/app/app/logs/actions";
import type { LogRow } from "@/lib/logs-data";

// 기록 목록(D-40 · D-106 · D-111) — 처음 20개는 미리 받은 것, 끝에 가까워지면 다음 20개를 서버 액션으로 이어 붙인다(인피니티 스크롤).
// 실패하면 그 자리에 '다시 불러오기' 버튼 — 저절로 다시 부르지 않는다.
export function LogsList({ initial, total }: { initial: LogRow[]; total: number }) {
  const [rows, setRows] = useState(initial);
  const [count, setCount] = useState(total);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const more = count > rows.length;

  function loadMore() {
    if (pending) return;
    const logs = rows.filter((r) => r.kind === "log");
    setFailed(false);
    start(async () => {
      const r = await loadMoreLogs(logs.length, logs[logs.length - 1]?.loggedOn ?? null).catch(() => null);
      if (!r?.ok) {
        setFailed(true);
        return;
      }
      if (!r.rows.length) {
        setCount(rows.length); // 더 없으면 끝
        return;
      }
      setRows((x) => [...x, ...r.rows]);
      setCount(r.total);
    });
  }

  // 목록 끝 표시가 화면 아래 한 화면 거리 안으로 들어오면 다음 묶음
  const loadRef = useRef(loadMore);
  loadRef.current = loadMore;
  useEffect(() => {
    const el = end.current;
    if (!el || !more || failed) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && loadRef.current(), {
      rootMargin: "0px 0px 600px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [more, failed, rows.length]);

  return (
    <section className="flex flex-col gap-3">
      <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
        전체 {count}개{more && ` · 지금 ${rows.length}개`}
      </span>
      <LogList rows={rows} />
      {more && (
        <div ref={end} className="flex flex-col gap-3" aria-busy={pending || undefined}>
          {failed ? (
            <Button variant="secondary" className="h-11 rounded-full text-[15px]" onClick={loadMore}>
              더 불러오지 못했어요 — 다시 불러오기
            </Button>
          ) : (
            Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
          )}
        </div>
      )}
    </section>
  );
}
