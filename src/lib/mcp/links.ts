import type { Library } from "@/lib/mcp/library";

// "막히면 · 결정" 줄의 "→ 다음 수"를 우리 기술 · 포지션에 잇는다(D-83). 저장하지 않고 읽을 때 이름으로 맞춘다 —
// 기술 이름을 고쳐도 링크가 따라오고, 줄 글은 사람이 읽는 그대로 둔다.

export type Link = { kind: "technique" | "position"; slug: string; name: string };
type Entry = Link & { key: string; alias: boolean };

const norm = (s: string) => s.toLowerCase().replace(/[\s·\-_()/,.]+/g, "");

const indexes = new WeakMap<Library, Entry[]>();

function index(lib: Library): Entry[] {
  const hit = indexes.get(lib);
  if (hit) return hit;
  const out: Entry[] = [];
  const add = (kind: Link["kind"], slug: string, name: string, label: string, alias: boolean) => {
    const key = norm(label);
    if (key.length >= 2) out.push({ kind, slug, name, key, alias });
  };
  for (const t of lib.techniques) {
    add("technique", t.slug, t.nameKo, t.nameKo, false);
    for (const a of t.aliases) if (norm(a).length >= 3) add("technique", t.slug, t.nameKo, a, true);
  }
  for (const p of lib.positions) {
    add("position", p.slug, p.nameKo, p.nameKo, false);
    for (const part of p.nameKo.split(/\s*[·(]\s*|\)/)) if (norm(part).length >= 2) add("position", p.slug, p.nameKo, part, true);
  }
  // 긴 이름부터 — "하프가드 백 테이크" 가 "하프가드" 보다 먼저 맞게. 같은 길이면 진짜 이름이 다른 이름보다,
  // 기술이 포지션보다 먼저("암바 (백)" 은 다른 이름 "암바 백" 을 가진 '암바 안 되면 백 테이크' 가 아니라 '암바 (백)')
  out.sort((a, b) => b.key.length - a.key.length || Number(a.alias) - Number(b.alias) || (a.kind === "technique" ? -1 : 1));
  indexes.set(lib, out);
  return out;
}

/** 줄에서 "→" 뒤를 읽어 맞는 기술 · 포지션을 찾는다(겹치지 않게, 최대 3개). 화살표가 없으면 []. */
export function linksOf(lib: Library, line: string): Link[] {
  const i = line.indexOf("→"); // 기술 이름에도 "→" 가 있어(오모플라타 → 백) 첫 화살표 뒤 전부를 본다
  if (i < 0) return [];
  let target = norm(line.slice(i + 1));
  const found: Link[] = [];
  for (const e of index(lib)) {
    if (found.length >= 3) break;
    const at = target.indexOf(e.key);
    if (at < 0) continue;
    if (!found.some((f) => f.kind === e.kind && f.slug === e.slug)) found.push({ kind: e.kind, slug: e.slug, name: e.name });
    target = target.slice(0, at) + "|".repeat(e.key.length) + target.slice(at + e.key.length); // 쓴 자리는 지운다
  }
  return found;
}

/** 줄 끝에 [slug] 를 붙여 MCP 답에서 바로 rereroll_get_technique 로 이어 가게. */
export function withLinks(lib: Library, line: string): string {
  const links = linksOf(lib, line);
  if (!links.length) return line;
  return `${line}  ⟶ ${links.map((l) => (l.kind === "technique" ? `[${l.slug}]` : `[포지션 ${l.slug}]`)).join(" ")}`;
}
