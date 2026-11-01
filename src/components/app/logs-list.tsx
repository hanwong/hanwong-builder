"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogList } from "@/components/app/log-list";
import { loadMoreLogs } from "@/app/app/logs/actions";
import type { LogRow } from "@/lib/logs-data";

// 기록 목록 + 더 보기(D-40 · D-106) — 처음 30개는 미리 받은 것, 더 보기는 서버 액션으로 이어 붙인다(주소는 그대로).
export function LogsList({ initial, total }: { initial: LogRow[]; total: number }) {
  const [rows, setRows] = useState(initial);
  const [count, setCount] = useState(total);
  const [pending, start] = useTransition();
  const more = count > rows.length;

  function loadMore() {
    const logs = rows.filter((r) => r.kind === "log");
    start(async () => {
      const r = await loadMoreLogs(logs.length, logs[logs.length - 1]?.loggedOn ?? null).catch(() => null);
      if (!r?.ok) {
        toast.error("더 불러오지 못했어요 — 다시 눌러 주세요.");
        return;
      }
      if (!r.rows.length) {
        setCount(rows.length); // 더 없으면 버튼을 거둔다
        return;
      }
      setRows((x) => [...x, ...r.rows]);
      setCount(r.total);
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
        전체 {count}개{more && ` · 최근 ${rows.length}개`}
      </span>
      <LogList rows={rows} />
      {more && (
        <Button variant="secondary" className="h-11 rounded-full text-[15px]" onClick={loadMore} disabled={pending}>
          {pending ? "불러오는 중…" : "더 보기"}
        </Button>
      )}
    </section>
  );
}
