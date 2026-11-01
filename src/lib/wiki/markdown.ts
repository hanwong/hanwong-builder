import type { Concept, Drill, Library, Position, Technique } from "@/lib/mcp/library-data";
import { ROLE_NOTE } from "@/lib/mcp/labels";
import {
  arrivingAt,
  conceptsForPosition,
  conceptsForTechnique,
  drillsForTechnique,
  LICENSE_LINE,
  LICENSE_NAME,
  LICENSE_URL,
  notesFor,
  RIGHT_HANDED,
  segments,
  SITE,
  techMeta,
  techniquesByRole,
  WIKI_NOTICE,
  WIKI_REPO,
  type Kind,
} from "@/lib/wiki/model";

// 기술 지도 LLM 위키(D-114) — 항목 하나 = 마크다운 문서 하나. 문서끼리 상대 링크라 GitHub · Obsidian 에서 바로 넘겨 본다.
// 맨 앞 index.md(목차) · AGENTS.md(AI 가 읽는 법) · all-techniques.md(기술 한 줄씩)로 AI 가 필요한 문서만 골라 읽게.

export type WikiFile = { path: string; content: string };

const href = (from: Kind | null, kind: Kind, slug: string) => `${from ? "../" : ""}${kind}/${slug}.md`;
const md = (from: Kind | null, kind: Kind, slug: string, name: string) => `[${name}](${href(from, kind, slug)})`;
const bullets = (lines: string[]) => lines.map((l) => `- ${l}`).join("\n");
const numbered = (lines: string[]) => lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
const section = (title: string, body: string) => (body ? `## ${title}\n\n${body}` : "");
const join = (parts: string[]) => parts.filter(Boolean).join("\n\n") + "\n";
const yaml = (fields: Record<string, string | string[] | null>) =>
  `---\n${Object.entries(fields)
    .filter(([, v]) => v !== null && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(", ")}]` : JSON.stringify(v)}`)
    .join("\n")}\n---`;
const footer = (web: string) => `---\n\n${WIKI_NOTICE.join(" ")}\n\n웹에서 보기: ${SITE}${web} · ${LICENSE_LINE}`;

function linked(lib: Library, from: Kind, line: string): string {
  return segments(lib, line)
    .map((s) => (typeof s === "string" ? s : md(from, s.kind === "technique" ? "techniques" : "positions", s.slug, s.name)))
    .join("");
}

const techLine = (lib: Library, from: Kind | null, t: Technique) => {
  const meta = techMeta(lib, t);
  return `${md(from, "techniques", t.slug, t.nameKo)} (${t.nameEn})${meta ? ` — ${meta}` : ""}`;
};

function positionDoc(lib: Library, p: Position): string {
  const notes = notesFor(lib, p.slug).map((n) =>
    join([
      `## ${ROLE_NOTE[n.role]}${n.role === "standing" ? "" : "에서"}`,
      n.goals.length ? `### 목표 (순서대로)\n\n${numbered(n.goals)}` : "",
      n.keys.length ? `### 핵심\n\n${bullets(n.keys)}` : "",
      n.decisions.length ? `### 상대가 ~하면\n\n${bullets(n.decisions.map((l) => linked(lib, "positions", l)))}` : "",
      n.mistakes.length ? `### 흔한 실수\n\n${bullets(n.mistakes)}` : "",
      n.drills.length ? `### 드릴\n\n${bullets(n.drills)}` : "",
    ]).trim(),
  );
  const groups = techniquesByRole(lib, p.slug).map(
    (g) => `### ${g.label} (${g.items.length})\n\n${bullets(g.items.map((t) => techLine(lib, "positions", t)))}`,
  );
  const arriving = arrivingAt(lib, p.slug);
  const concepts = conceptsForPosition(lib, p.slug);
  return join([
    yaml({ type: "position", slug: p.slug, name_ko: p.nameKo, name_en: p.nameEn }),
    `# ${p.nameKo} (${p.nameEn})`,
    p.summary,
    p.variants.length ? `이런 모양도 이 포지션이에요: ${p.variants.join(", ")}` : "",
    ...notes,
    groups.length ? `## 이 포지션의 기술\n\n${groups.join("\n\n")}` : "",
    section("이 포지션으로 오는 기술", bullets(arriving.map((t) => techLine(lib, "positions", t)))),
    section("관련 개념", bullets(concepts.map((c) => `${md("positions", "concepts", c.slug, c.nameKo)} — ${c.summary}`))),
    footer(`/wiki/positions/${p.slug}`),
  ]);
}

function techniqueDoc(lib: Library, t: Technique): string {
  const pos = lib.posBySlug.get(t.position);
  const ends = t.endsAt.map((s) => lib.posBySlug.get(s)).filter(Boolean) as Position[];
  const concepts = conceptsForTechnique(lib, t.slug);
  const drills = drillsForTechnique(lib, t.slug);
  const see = [
    ...concepts.map((c) => `개념 ${md("techniques", "concepts", c.slug, c.nameKo)}`),
    ...drills.map((d) => `드릴 ${md("techniques", "drills", d.slug, d.nameKo)}`),
  ];
  const meta = techMeta(lib, t).split(" → ")[0];
  return join([
    yaml({
      type: "technique",
      slug: t.slug,
      name_ko: t.nameKo,
      name_en: t.nameEn,
      aliases: t.aliases,
      position: t.position,
      kind: t.kind,
      role: t.role,
      ends_at: t.endsAt,
    }),
    `# ${t.nameKo} (${t.nameEn})`,
    [pos ? md("techniques", "positions", pos.slug, pos.nameKo) : "", meta].filter(Boolean).join(" · ") +
      (ends.length ? ` → ${ends.map((e) => md("techniques", "positions", e.slug, e.nameKo)).join(" / ")}` : ""),
    t.aliases.length ? `다른 이름: ${t.aliases.join(", ")}` : "",
    section("규정 · 안전", bullets(t.rules)),
    section("세팅 과정 (오른손잡이 기준)", numbered(t.steps)),
    section("핵심 디테일", bullets(t.keyPoints)),
    section("흔한 실수", bullets(t.mistakes)),
    section("막히면", bullets(t.ifBlocked.map((l) => linked(lib, "techniques", l)))),
    section("방어하는 쪽 (상대 입장)", bullets(t.defense)),
    section("함께 보기", bullets(see)),
    footer(`/wiki/techniques/${t.slug}`),
  ]);
}

function conceptDoc(lib: Library, c: Concept): string {
  const pos = c.relatedPositions.map((s) => lib.posBySlug.get(s)).filter(Boolean) as Position[];
  const tech = c.relatedTechniques.map((s) => lib.bySlug.get(s)).filter(Boolean) as Technique[];
  const also = c.seeAlso.map((s) => lib.conceptBySlug.get(s)).filter(Boolean) as Concept[];
  return join([
    yaml({ type: "concept", slug: c.slug, name_ko: c.nameKo, name_en: c.nameEn, kind: c.kind }),
    `# ${c.nameKo} (${c.nameEn}) — ${c.kind === "principle" ? "원리" : "공부법"}`,
    c.summary,
    bullets(c.body),
    section("어디서 쓰나", bullets(c.examples)),
    section("관련 포지션", bullets(pos.map((p) => md("concepts", "positions", p.slug, p.nameKo)))),
    section("관련 기술", bullets(tech.map((t) => techLine(lib, "concepts", t)))),
    section("함께 보기", bullets(also.map((x) => `${md("concepts", "concepts", x.slug, x.nameKo)} — ${x.summary}`))),
    footer(`/wiki/concepts/${c.slug}`),
  ]);
}

function drillDoc(lib: Library, d: Drill): string {
  const tech = d.related.map((s) => lib.bySlug.get(s)).filter(Boolean) as Technique[];
  return join([
    yaml({ type: "drill", slug: d.slug, name_ko: d.nameKo, name_en: d.nameEn, aliases: d.aliases }),
    `# ${d.nameKo} (${d.nameEn}) — 기본 드릴`,
    d.aliases.length ? `다른 이름: ${d.aliases.join(", ")}` : "",
    d.summary,
    section("하는 법 (오른손잡이 기준 · 양쪽 번갈아)", numbered(d.steps)),
    section("노하우", bullets(d.tips)),
    section("이 드릴이 필요한 이유", bullets(d.why)),
    section("이어지는 기술", bullets(tech.map((t) => techLine(lib, "drills", t)))),
    footer(`/wiki/drills/${d.slug}`),
  ]);
}

function indexDoc(lib: Library, date: string): string {
  const count = (slug: string) => lib.techniques.filter((t) => t.position === slug).length;
  const principles = lib.concepts.filter((c) => c.kind === "principle");
  const learning = lib.concepts.filter((c) => c.kind !== "principle");
  const cLine = (c: Concept) => `- ${md(null, "concepts", c.slug, c.nameKo)} — ${c.summary}`;
  return join([
    "# 리리롤 주짓수 기술 지도 — 목차",
    `포지션 ${lib.positions.length} · 기술 ${lib.techniques.length} · 개념 ${lib.concepts.length} · 기본 드릴 ${lib.drills.length}. ${date} 기준. 처음이면 [AGENTS.md](AGENTS.md)(읽는 법)부터, 기술 이름으로 찾으려면 [all-techniques.md](all-techniques.md).`,
    section(
      "포지션",
      lib.positions
        .map((p) => `- ${md(null, "positions", p.slug, p.nameKo)} (${p.nameEn}) — 기술 ${count(p.slug)}개. ${p.summary}`)
        .join("\n"),
    ),
    section("개념 — 원리", principles.map(cLine).join("\n")),
    section("개념 — 공부법", learning.map(cLine).join("\n")),
    section(
      "기본 드릴",
      lib.drills.map((d) => `- ${md(null, "drills", d.slug, d.nameKo)} (${d.nameEn}) — ${d.summary}`).join("\n"),
    ),
    `---\n\n${WIKI_NOTICE.join(" ")}\n\n${LICENSE_LINE}`,
  ]);
}

function allTechniquesDoc(lib: Library): string {
  const lines = lib.positions.map((p) => {
    const mine = lib.techniques.filter((t) => t.position === p.slug);
    if (!mine.length) return "";
    return `## ${p.nameKo}\n\n${bullets(
      mine.map((t) => `${techLine(lib, null, t)}${t.aliases.length ? ` · 다른 이름: ${t.aliases.join(", ")}` : ""}`),
    )}`;
  });
  return join([
    "# 기술 전체 (한 줄씩)",
    "포지션별로 모든 기술을 한 줄씩 적었어요 — 한국어 이름 (영어 이름) — 종류 · 쓰는 쪽 → 성공하면 가는 포지션 · 다른 이름. 기술 이름이 헷갈리면 여기서 찾아요.",
    ...lines,
  ]);
}

const AGENTS = `# AGENTS.md — 이 위키를 읽는 AI 에게

이 저장소는 리리롤(rereroll.xyz)의 주짓수 기술 지도를 항목마다 마크다운 문서 하나로 나눈 위키예요. 답하기 전에 아래 순서로 찾아 읽어요.

## 찾는 순서

1. [index.md](index.md) — 포지션 · 개념 · 기본 드릴 목차. 질문에 맞는 포지션을 먼저 고른다.
2. 기술 이름을 알면 [all-techniques.md](all-techniques.md) 에서 한국어 · 영어 · 다른 이름으로 찾는다.
3. \`positions/<slug>.md\` — 위 · 아래 쪽의 목표, 핵심, "상대가 ~하면 → 기술", 흔한 실수, 그 포지션의 기술 목록.
4. \`techniques/<slug>.md\` — 세팅 과정, 핵심 디테일, 흔한 실수, 막히면(다음 기술 링크), 방어하는 쪽, 규정 · 안전.
5. \`concepts/<slug>.md\` — 프레임 · 거리 같은 원리와 공부법. \`drills/<slug>.md\` — 혼자 하는 기본 드릴.

문서 맨 위 \`---\` 사이(frontmatter)에 slug · 이름 · 포지션 · 종류(kind) · 쓰는 쪽(role) · 도착 포지션(ends_at)이 있어요. 링크를 따라가면 "막히면 → 다음 기술" 처럼 기술끼리 이어져요.

## 답할 때 지킬 것

- 이 위키에 있는 내용에 근거해서 답하고, 없는 동작 · 세부는 지어내지 않는다. 없으면 없다고 말한다.
- ${RIGHT_HANDED}
- 기술에 "규정 · 안전" 이 있으면(하체 관절기 · 도복 전용 등) 도복 · 노기, 대회 허용 띠, 안전 요령을 답에 꼭 함께 말한다.
- 내용은 AI 가 쓴 공부용 자료이고 사람(블랙벨트)이 검증하지 않았다. 답 끝에 "틀릴 수 있으니 코치에게 확인하라"는 안내를 짧게 붙인다.
- 내용을 옮겨 쓸 때는 출처(리리롤 rereroll.xyz)를 밝힌다. ${LICENSE_NAME} — 비상업 목적만.

## 늘 최신으로 쓰려면

이 위키는 리리롤 DB 에서 만든 사본이에요. 가장 최신 내용은 리리롤 MCP(${SITE}/mcp)나 웹 위키(${SITE}/wiki)에 있어요.
`;

function readme(lib: Library, date: string): string {
  return join([
    "# 리리롤 주짓수 기술 위키 (Re:Re:Roll BJJ Wiki)",
    `주짓수 포지션 ${lib.positions.length}개 · 기술 ${lib.techniques.length}개 · 개념 ${lib.concepts.length}개 · 기본 드릴 ${lib.drills.length}개를 서로 링크한 한국어 위키예요. 사람이 읽어도 되고, Claude · ChatGPT · NotebookLM 같은 AI 에 넣어 "이 상황에서 뭘 해?" 를 물어보는 자료(LLM 위키)로 쓰라고 만들었어요. ${date} 기준.`,
    "A Korean Brazilian Jiu-Jitsu knowledge wiki (positions, techniques, principles, drills) written as interlinked Markdown for people and LLMs. Non-commercial use only.",
    section(
      "구성",
      bullets([
        "[index.md](index.md) — 목차(여기서 시작)",
        "[AGENTS.md](AGENTS.md) — AI 가 이 위키를 읽고 답하는 법",
        "[all-techniques.md](all-techniques.md) — 기술 전체 한 줄씩",
        "`positions/` · `techniques/` · `concepts/` · `drills/` — 항목마다 문서 하나",
      ]),
    ),
    section(
      "쓰는 법",
      bullets([
        "**Claude 프로젝트 · ChatGPT · NotebookLM**: 저장소를 내려받아(Code → Download ZIP) 문서들을 자료로 올리고, AGENTS.md 를 지침에 붙여 넣어요.",
        "**Obsidian**: 내려받은 폴더를 보관함(vault)으로 열면 링크를 따라 넘겨 볼 수 있어요.",
        `**웹**: ${SITE}/wiki 에서 같은 내용을 볼 수 있어요. Claude 에 바로 붙이려면 리리롤 MCP(${SITE}/mcp).`,
      ]),
    ),
    section(
      "꼭 알아 둘 것",
      bullets([
        "AI 가 추천해 쓴 공부용 자료예요. 사람(블랙벨트)이 검증하지 않아 틀릴 수 있으니 코치님께 꼭 확인하세요.",
        RIGHT_HANDED,
        "수련 기록 · 숙련도 같은 사용자 데이터는 들어 있지 않아요(공용 기술 지도만).",
      ]),
    ),
    section(
      "라이선스",
      `${LICENSE_NAME} ([LICENSE.md](LICENSE.md)) — 비상업 목적으로, 출처(리리롤 · ${SITE})를 밝히고, 고친 것도 같은 조건으로 나눌 때만 쓸 수 있어요.`,
    ),
  ]);
}

const LICENSE = `# 라이선스 (License)

이 저장소의 글(기술 지도 · 위키 문서)은 크리에이티브 커먼즈 저작자표시-비영리-동일조건변경허락 4.0 국제 라이선스(${LICENSE_NAME})를 따릅니다.

The written content of this repository is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.

- 전문(Legal code): https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
- 요약: ${LICENSE_URL}

출처 표시 예: "리리롤 주짓수 기술 위키(${WIKI_REPO}), ${LICENSE_NAME}"

`;

/** 위키 문서 전체. date 는 'YYYY-MM-DD'(만든 날). */
export function wikiFiles(lib: Library, date: string): WikiFile[] {
  return [
    { path: "README.md", content: readme(lib, date) },
    { path: "AGENTS.md", content: AGENTS },
    { path: "LICENSE.md", content: LICENSE },
    { path: "index.md", content: indexDoc(lib, date) },
    { path: "all-techniques.md", content: allTechniquesDoc(lib) },
    ...lib.positions.map((p) => ({ path: `positions/${p.slug}.md`, content: positionDoc(lib, p) })),
    ...lib.techniques.map((t) => ({ path: `techniques/${t.slug}.md`, content: techniqueDoc(lib, t) })),
    ...lib.concepts.map((c) => ({ path: `concepts/${c.slug}.md`, content: conceptDoc(lib, c) })),
    ...lib.drills.map((d) => ({ path: `drills/${d.slug}.md`, content: drillDoc(lib, d) })),
  ];
}
