import { AI_NOTICE } from "@/lib/ai-notice";
import { KIND_KO, ROLE_KO } from "@/lib/mcp/labels";
import { linksOf, type Link } from "@/lib/mcp/links";
import type { Concept, Drill, Library, Technique } from "@/lib/mcp/library-data";

// 기술 지도 위키(D-114) — GitHub 마크다운과 웹 위키(/wiki)가 같이 쓰는 묶기 · 잇기 규칙. 공용 목록만 다룬다.

export const SITE = "https://rereroll.xyz";
export const WIKI_REPO = "https://github.com/hanwong/rereroll-wiki";
export const LICENSE_NAME = "CC BY-NC-SA 4.0";
export const LICENSE_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko";
export const RIGHT_HANDED = "좌우는 모두 오른손잡이 기준이에요(왼손잡이는 반대로).";
export const BJJGRAPH_NOTE = "일부 내용은 BJJGraph(© Diogo Seca, bjjgraph.org)를 참고해 우리 말로 새로 썼어요.";
export const LICENSE_LINE = `리리롤(rereroll.xyz) 기술 지도 · ${LICENSE_NAME} — 비상업 목적으로, 출처를 밝히고, 같은 조건으로만 나눌 수 있어요.`;
export const WIKI_NOTICE = [RIGHT_HANDED, AI_NOTICE, BJJGRAPH_NOTE];

export type Kind = "positions" | "techniques" | "concepts" | "drills";
export type Segment = string | Link;

/** "상대가 ~하면 → 기무라 (가드)" 의 이름 자리를 링크로. 글에 이름이 그대로 없으면 줄 끝에 붙인다. */
export function segments(lib: Library, line: string): Segment[] {
  const links = linksOf(lib, line);
  if (!links.length) return [line];
  const arrow = line.indexOf("→");
  const after = line.slice(arrow);
  // 글에 나온 자리 순서대로 바꾼다(찾기는 긴 이름부터라 순서가 섞여 있음) — 겹치는 자리는 건너뛴다
  const found: { at: number; link: Link }[] = [];
  const tail: Link[] = [];
  for (const link of links) {
    const at = after.indexOf(link.name);
    const clash = found.some((f) => at < f.at + f.link.name.length && f.at < at + link.name.length);
    if (at < 0 || clash) tail.push(link);
    else found.push({ at, link });
  }
  found.sort((x, y) => x.at - y.at);
  const out: Segment[] = [line.slice(0, arrow)];
  let pos = 0;
  for (const f of found) {
    out.push(after.slice(pos, f.at), f.link);
    pos = f.at + f.link.name.length;
  }
  out.push(after.slice(pos));
  for (const l of tail) out.push(" · ", l);
  return out.filter((s) => s !== "");
}

const ROLE_ORDER = ["bottom", "top", "standing", "both"];

/** 포지션의 기술 — 쓰는 쪽(아래 · 위 · 서서)별로, 그 안은 적어 둔 순서대로. */
export function techniquesByRole(lib: Library, position: string): { role: string; label: string; items: Technique[] }[] {
  const mine = lib.techniques.filter((t) => t.position === position);
  const roles = [...new Set(mine.map((t) => t.role ?? "both"))].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
  return roles.map((role) => ({
    role,
    label: role === "both" ? "위 · 아래 모두" : `${ROLE_KO[role] ?? role}에서`,
    items: mine.filter((t) => (t.role ?? "both") === role),
  }));
}

/** 다른 포지션에서 시작해 이 포지션으로 오는 기술. */
export function arrivingAt(lib: Library, position: string): Technique[] {
  return lib.techniques.filter((t) => t.position !== position && t.endsAt.includes(position));
}

/** 기술 한 줄 설명 — "스윕 · 아래 → 마운트". */
export function techMeta(lib: Library, t: Technique): string {
  const meta = [t.kind && KIND_KO[t.kind], t.role && ROLE_KO[t.role]].filter(Boolean).join(" · ");
  const to = t.endsAt.map((s) => lib.posBySlug.get(s)?.nameKo ?? s).join(" / ");
  return to ? `${meta} → ${to}` : meta;
}

export const conceptsForPosition = (lib: Library, slug: string): Concept[] =>
  lib.concepts.filter((c) => c.relatedPositions.includes(slug));
export const conceptsForTechnique = (lib: Library, slug: string): Concept[] =>
  lib.concepts.filter((c) => c.relatedTechniques.includes(slug));
export const drillsForTechnique = (lib: Library, slug: string): Drill[] => lib.drills.filter((d) => d.related.includes(slug));
export const notesFor = (lib: Library, position: string) =>
  lib.notes.filter((n) => n.position === position).sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
