import "server-only";
import { candidates, type Candidate } from "./library";

// 기술 추가 검색 (D-31) — 이름 · 영어 이름 · 다른 이름에서 찾는다. Claude 를 부르지 않는다.
const norm = (s: string) => s.toLowerCase().replace(/[\s·.,()\-→/]/g, "");

const index = candidates.map((t) => ({
  t,
  name: norm(t.nameKo),
  others: [norm(t.nameEn), ...t.aliases.map(norm)],
}));

// 이름이 그 말로 시작 > 이름에 들어 있음 > 다른 이름에 들어 있음. 같으면 짧은 이름(기본 기술) 먼저.
export function searchLibrary(query: string, limit = 8): Candidate[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const scored: { t: Candidate; score: number }[] = [];
  for (const { t, name, others } of index) {
    const score = name.startsWith(q) ? 3 : name.includes(q) ? 2 : others.some((o) => o.includes(q)) ? 1 : 0;
    if (score) scored.push({ t, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.t.nameKo.length - b.t.nameKo.length)
    .slice(0, limit)
    .map((x) => x.t);
}
