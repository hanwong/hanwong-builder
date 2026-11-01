"use server";

import { fetchLogs, fetchLogsInMonth, type LogRow } from "@/lib/logs-data";
import { seoulToday } from "@/lib/seoul-date";

// 기록 탭에서 처음 받은 뒤 이어 받는 것(D-106) — 더 보기 · 다른 달. 본인 것만 보이는 건 RLS 가 막는다.
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

type More = { ok: true; rows: LogRow[]; total: number } | { ok: false };

export async function loadMoreLogs(offset: number, before: string | null): Promise<More> {
  if (!Number.isInteger(offset) || offset < 1 || offset > 990 || (before !== null && !DATE.test(before)))
    return { ok: false };
  try {
    const r = await fetchLogs(offset, before);
    return { ok: true, rows: r.rows, total: r.total };
  } catch (e) {
    console.error("logs more failed:", e instanceof Error ? e.message : "unknown");
    return { ok: false };
  }
}

export async function loadMonth(month: string): Promise<{ ok: true; rows: LogRow[] } | { ok: false }> {
  // 2000년부터 이번 달까지만
  if (!MONTH.test(month) || month < "2000-01" || month > seoulToday().slice(0, 7)) return { ok: false };
  try {
    return { ok: true, rows: await fetchLogsInMonth(month) };
  } catch (e) {
    console.error("logs month failed:", e instanceof Error ? e.message : "unknown");
    return { ok: false };
  }
}
