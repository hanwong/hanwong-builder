import "server-only";
import type { Candidate, Library } from "./library";

// 기술 추가 검색 (D-31) — 이름 · 영어 이름 · 다른 이름에서 찾는다. Claude 를 부르지 않는다.
const norm = (s: string) => s.toLowerCase().replace(/[\s·.,()\-→/]/g, "");

type Entry = { t: Candidate; name: string; others: string[] };
const indexes = new WeakMap<Library, Entry[]>();
function indexOf(lib: Library): Entry[] {
  let index = indexes.get(lib);
  if (!index) {
    index = lib.candidates.map((t) => ({ t, name: norm(t.nameKo), others: [norm(t.nameEn), ...t.aliases.map(norm)] }));
    indexes.set(lib, index);
  }
  return index;
}

function rank(entries: Entry[], query: string, limit: number): Candidate[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const scored: { t: Candidate; score: number }[] = [];
  for (const { t, name, others } of entries) {
    const score = name.startsWith(q) ? 3 : name.includes(q) ? 2 : others.some((o) => o.includes(q)) ? 1 : 0;
    if (score) scored.push({ t, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.t.nameKo.length - b.t.nameKo.length)
    .slice(0, limit)
    .map((x) => x.t);
}

// 이름이 그 말로 시작 > 이름에 들어 있음 > 다른 이름에 들어 있음. 같으면 짧은 이름(기본 기술) 먼저.
export function searchLibrary(lib: Library, query: string, limit = 8): Candidate[] {
  return rank(indexOf(lib), query, limit);
}

// 내가 만든 기술(D-57)처럼 캐시하지 않는 짧은 목록
export function searchList<T extends Candidate>(list: T[], query: string, limit = 8): T[] {
  return rank(
    list.map((t) => ({ t, name: norm(t.nameKo), others: [norm(t.nameEn), ...t.aliases.map(norm)] })),
    query,
    limit,
  ) as T[];
}

// 적힌 이름과 이름 · 영어 이름 · 다른 이름이 (띄어쓰기 · 대소문자 · 문장부호 무시하고) 똑같은 기술
export function exactMatch<T extends Candidate>(list: T[], name: string): T | undefined {
  const q = norm(name);
  return q ? list.find((t) => [t.nameKo, t.nameEn, ...t.aliases].some((x) => norm(x) === q)) : undefined;
}
