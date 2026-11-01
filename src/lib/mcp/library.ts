import "server-only";
import { fetchLibraryData, toLibrary, type Library } from "@/lib/mcp/library-data";

// 리리롤 MCP(D-81 · D-83)가 읽는 공용 기술 목록 · 포지션 노트 · 개념 카드. 로그인 없이(anon) 공용 기술 · 포지션만 읽는다 — 사용자 표는 접근 규칙으로 막혀 있다.
// 함수 인스턴스마다 10분 동안 들고 있는다(목록은 마이그레이션 · 운영 승인으로만 바뀜).

export type { Concept, Drill, Library, LibraryData, Position, PositionNote, Technique } from "@/lib/mcp/library-data";

const TTL = 10 * 60 * 1000;
let cache: { at: number; lib: Promise<Library> } | null = null;

export function loadLibrary(): Promise<Library> {
  if (cache && Date.now() - cache.at < TTL) return cache.lib;
  const lib = fetchLibraryData().then(toLibrary);
  cache = { at: Date.now(), lib };
  lib.catch(() => (cache = null)); // 실패하면 다음 요청에서 다시
  return lib;
}
