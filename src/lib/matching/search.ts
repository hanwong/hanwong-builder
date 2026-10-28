import "server-only";
import type { Candidate, Library } from "./library";
import { indexList, norm, rank, type Indexed } from "./rank";

// 기술 추가 검색 (D-31) — 이름 · 영어 이름 · 다른 이름에서 찾는다. Claude 를 부르지 않는다.
const indexes = new WeakMap<Library, Indexed<Candidate>[]>();
function indexOf(lib: Library): Indexed<Candidate>[] {
  let index = indexes.get(lib);
  if (!index) {
    index = indexList(lib.candidates);
    indexes.set(lib, index);
  }
  return index;
}

export function searchLibrary(lib: Library, query: string, limit = 8): Candidate[] {
  return rank(indexOf(lib), query, limit);
}

// 내가 만든 기술(D-57)처럼 캐시하지 않는 짧은 목록
export function searchList<T extends Candidate>(list: T[], query: string, limit = 8): T[] {
  return rank(indexList(list), query, limit);
}

// 적힌 이름과 이름 · 영어 이름 · 다른 이름이 (띄어쓰기 · 대소문자 · 문장부호 무시하고) 똑같은 기술
export function exactMatch<T extends Candidate>(list: T[], name: string): T | undefined {
  const q = norm(name);
  return q ? list.find((t) => [t.nameKo, t.nameEn, ...t.aliases].some((x) => norm(x) === q)) : undefined;
}
