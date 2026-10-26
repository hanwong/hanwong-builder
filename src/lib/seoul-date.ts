// 날짜는 전부 Asia/Seoul 기준(DB.md 6). 렌더 중이 아니라 effect · 서버 기능 안에서만 부른다(cacheComponents).

// 서울 기준 오늘 (YYYY-MM-DD). en-CA 형식이 YYYY-MM-DD 다.
export function seoulToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// YYYY-MM-DD 에 n 일 더하기(달력 날짜 계산이라 시간대와 무관)
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export const isIsoDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
