import "server-only";
import { cacheLife } from "next/cache";
import { fetchLibraryData, toLibrary, type Library, type LibraryData } from "@/lib/mcp/library-data";
import type { Kind } from "@/lib/wiki/model";

// 웹 위키(D-114) — 로그인 없이 읽히는 공용 기술 지도만. 모두에게 같은 내용이라 서버에 1시간 담아 둔다.
async function getWikiData(): Promise<LibraryData> {
  "use cache";
  cacheLife("hours");
  return fetchLibraryData();
}

export async function getWiki(): Promise<Library> {
  return toLibrary(await getWikiData());
}

export const KINDS: Kind[] = ["positions", "techniques", "concepts", "drills"];

export async function wikiParams(): Promise<{ kind: Kind; slug: string }[]> {
  const lib = await getWiki();
  return [
    ...lib.positions.map((p) => ({ kind: "positions" as const, slug: p.slug })),
    ...lib.techniques.map((t) => ({ kind: "techniques" as const, slug: t.slug })),
    ...lib.concepts.map((c) => ({ kind: "concepts" as const, slug: c.slug })),
    ...lib.drills.map((d) => ({ kind: "drills" as const, slug: d.slug })),
  ];
}
