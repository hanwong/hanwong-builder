// 기술 이름 찾기 순위 (D-31) — 서버 검색(search.ts)과 기록 화면의 기술 고르기(브라우저, D-56 속도)가 같이 쓴다.
// 이름이 그 말로 시작 > 이름에 들어 있음 > 다른 이름에 들어 있음. 같으면 짧은 이름(기본 기술) 먼저.
export const norm = (s: string) => s.toLowerCase().replace(/[\s·.,()\-→/]/g, "");

export type Searchable = { nameKo: string; nameEn: string; aliases: string[] };
export type Indexed<T> = { t: T; name: string; others: string[] };

export const indexList = <T extends Searchable>(list: T[]): Indexed<T>[] =>
  list.map((t) => ({ t, name: norm(t.nameKo), others: [norm(t.nameEn), ...t.aliases.map(norm)] }));

export function rank<T extends Searchable>(entries: Indexed<T>[], query: string, limit: number): T[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const scored: { t: T; score: number }[] = [];
  for (const { t, name, others } of entries) {
    const score = name.startsWith(q) ? 3 : name.includes(q) ? 2 : others.some((o) => o.includes(q)) ? 1 : 0;
    if (score) scored.push({ t, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.t.nameKo.length - b.t.nameKo.length)
    .slice(0, limit)
    .map((x) => x.t);
}
