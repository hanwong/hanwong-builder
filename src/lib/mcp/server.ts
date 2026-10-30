import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadLibrary, type Concept, type Library, type Position, type PositionNote, type Technique } from "@/lib/mcp/library";
import { withLinks } from "@/lib/mcp/links";

// 리리롤 MCP(D-81 · D-83) — 공용 기술 목록 · 포지션 노트 · 개념 카드를 읽기 전용으로 보여 주는 도구들. 사용자 기록 · 숙련도는 다루지 않는다.

const NOTICE =
  "리리롤(rereroll.xyz) 기술 목록 · 오른손잡이 기준(왼손잡이는 좌우 반대). AI 가 쓰고 사람(블랙벨트) 확인 전인 공부용 자료예요. 일부 내용은 BJJGraph(© Diogo Seca, bjjgraph.org)를 참고해 우리 말로 새로 썼어요.";

const INSTRUCTIONS = `리리롤 주짓수 기술 사전 · 지도. 한국어 이름으로 찾는다(영어 이름 · 다른 이름도 됨).
- 이름을 모르면 rereroll_search 부터. 질문 낱말(예: "하프가드 크로스페이스 방어")을 그대로 넣어도 세팅 과정 · 방어 내용까지 찾는다.
- "어떻게 해?" → rereroll_get_technique. "막는 법" → rereroll_get_technique(perspective="defender") 와, 그 자세의 아래쪽 기술(rereroll_position_options role=bottom).
- "여기서 뭘 해야 해? / 제일 중요한 게 뭐야?" → rereroll_get_position(role=top|bottom) 으로 목표 · 핵심 · "상대가 ~하면 → 기술" 을 먼저, 기술 목록은 rereroll_position_options.
- "프레임이 뭐야? / 왜 자꾸 눌려? / 포지션 스파링은?" 같은 원리 · 공부법 → rereroll_get_concept (모르면 rereroll_list_concepts).
- "A 에서 B 로" → rereroll_find_paths.
- 답 속 [slug] 는 그 기술로 바로 이어 볼 수 있다는 뜻 — 필요하면 rereroll_get_technique 로 따라간다.
- 좌우는 모두 오른손잡이 기준. 답할 때 이 점과 '공부용 · 사람 확인 전'임을 짧게 밝힌다.`;

const KIND_KO: Record<string, string> = {
  takedown: "테이크다운",
  guard_pull: "가드 풀링",
  sweep: "스윕",
  pass: "패스",
  submission: "서브미션",
  escape: "탈출",
  back_take: "백 테이크",
  transition: "전환",
  control: "자세 · 컨트롤",
  defense: "방어",
};
const ROLE_KO: Record<string, string> = { top: "위", bottom: "아래", standing: "서서", both: "위 · 아래" };

const norm = (s: string) => s.toLowerCase().replace(/[\s·\-_()/,.]+/g, "");
const STOP = new Set(["방법", "어떻게", "알려줘", "알려", "하는", "하는법", "법", "좀", "에서", "때", "할", "수", "있는", "뭐", "기술", "how", "to", "the", "from", "in"]);
const DEFENSE_WORDS = ["방어", "막", "막는", "막기", "대처", "카운터", "탈출", "빠져"];

function tokens(q: string): string[] {
  return q
    .split(/[\s,?!.]+/)
    .map((w) => w.replace(/(을|를|이|가|은|는|에서|에|으로|로|하는|할때|때)$/u, ""))
    .map(norm)
    .filter((w) => w.length >= 2 && !STOP.has(w));
}

function resolvePosition(lib: Library, q: string): Position | null {
  const n = norm(q);
  if (!n) return null;
  const alias: Record<string, string> = {
    백: "back-control", 백컨트롤: "back-control", 사이드: "side-control", 하프: "half-guard", 하프가드: "half-guard",
    딥하프: "deep-half", 클로즈드: "closed-guard", 풀가드: "closed-guard", 마운트: "mount", 남북: "north-south",
    노스사우스: "north-south", 터틀: "turtle", 거북: "turtle", 니온밸리: "knee-on-belly", 곁누르기: "kesa-gatame",
    케사: "kesa-gatame", 스탠딩: "standing", 서서: "standing", 테이크다운: "standing", 클린치: "clinch",
    가드풀링: "clinch", 패스: "passing", 오픈가드: "open-guard", 버터플라이: "butterfly-guard", 데라히바: "de-la-riva",
    스파이더: "spider-lasso", 라쏘: "spider-lasso", 라펠: "lapel-guard", x가드: "x-guard", 프론트헤드락: "front-headlock",
    길로틴: "front-headlock", 서브미션: "submission-control",
  };
  if (alias[n]) return lib.posBySlug.get(alias[n]) ?? null;
  const exact = lib.positions.find((p) => p.slug === q || norm(p.nameKo) === n || norm(p.nameEn) === n);
  if (exact) return exact;
  return lib.positions.find((p) => norm(p.nameKo).startsWith(n) || norm(p.nameKo).includes(n) || norm(p.nameEn).includes(n)) ?? null;
}

function resolveTechnique(lib: Library, q: string): Technique | { candidates: Technique[] } {
  const n = norm(q);
  const bySlug = lib.bySlug.get(q.trim());
  if (bySlug) return bySlug;
  const exact = lib.techniques.find((t) => norm(t.nameKo) === n || norm(t.nameEn) === n || t.aliases.some((a) => norm(a) === n));
  if (exact) return exact;
  const hits = search(lib, q).map((h) => h.t);
  if (hits.length === 1) return hits[0];
  return { candidates: hits.slice(0, 8) };
}

type Hit = { t: Technique; score: number; snippet: string };

function search(lib: Library, q: string): Hit[] {
  const toks = tokens(q);
  if (!toks.length) return [];
  const posToks = toks.map((w) => resolvePosition(lib, w)?.slug ?? null);
  const wantsDefense = toks.some((w) => DEFENSE_WORDS.some((d) => w.startsWith(d)));
  const hits: Hit[] = [];
  for (const t of lib.techniques) {
    const name = norm(t.nameKo);
    const en = norm(t.nameEn);
    const al = t.aliases.map(norm);
    const fields: [string, string[]][] = [
      ["방어", t.defense],
      ["세팅", t.steps],
      ["핵심", t.keyPoints],
      ["막히면", t.ifBlocked],
      ["실수", t.mistakes],
    ];
    let score = 0;
    let snippet = "";
    let matchedAll = true;
    toks.forEach((w, i) => {
      if (DEFENSE_WORDS.some((d) => w.startsWith(d))) return; // 의도 낱말 — 아래에서 따로
      let s = 0;
      if (name === w) s = 100;
      else if (name.includes(w)) s = 60;
      else if (al.some((a) => a.includes(w))) s = 45;
      else if (en.includes(w)) s = 40;
      else if (posToks[i] && t.position === posToks[i]) s = 20;
      else {
        for (const [label, lines] of fields) {
          const line = lines.find((l) => norm(l).includes(w));
          if (line) {
            s = label === "방어" && wantsDefense ? 30 : 12;
            if (!snippet) snippet = `${label}: ${line}`;
            break;
          }
        }
      }
      if (s === 0) matchedAll = false;
      score += s;
    });
    if (!score) continue;
    if (wantsDefense && t.defense.length) score += 5;
    if (posToks.includes(t.position)) score += 15; // 질문에 나온 포지션의 기술을 먼저
    hits.push({ t, score: matchedAll ? score : Math.floor(score / 3), snippet, full: matchedAll } as Hit & { full: boolean });
  }
  // 모든 낱말이 맞은 카드가 있으면 그것만 — 일부만 맞은 카드는 뺀다
  const full = (hits as (Hit & { full: boolean })[]).filter((h) => h.full);
  const pool = full.length ? full : hits;
  return pool.sort((a, b) => b.score - a.score).filter((h, _, all) => h.score >= Math.min(20, all[0].score));
}

const ROLE_NOTE: Record<PositionNote["role"], string> = { top: "위", bottom: "아래", standing: "서서" };

// 개념 카드 · 포지션 노트에서도 찾는다(D-83) — 기술 검색과 같은 낱말 규칙, 모든 낱말이 맞아야
function searchExtra(lib: Library, q: string): string[] {
  const toks = tokens(q).filter((w) => !DEFENSE_WORDS.some((d) => w.startsWith(d)));
  if (!toks.length) return [];
  const out: { s: number; line: string }[] = [];
  for (const c of lib.concepts) {
    const head = norm(c.nameKo + c.nameEn + c.slug);
    const all = [c.summary, ...c.body, ...c.examples];
    let s = 0;
    for (const w of toks) s += head.includes(w) ? 50 : all.some((l) => norm(l).includes(w)) ? 10 : -1000;
    if (s > 0) out.push({ s: s + 5, line: `- 개념: ${c.nameKo} (${c.nameEn}) [concept ${c.slug}] — ${c.summary}` });
  }
  for (const n of lib.notes) {
    const p = lib.posBySlug.get(n.position);
    if (!p) continue;
    const posHit = toks.map((w) => resolvePosition(lib, w)?.slug === p.slug);
    const lines = [...n.goals, ...n.keys, ...n.decisions, ...n.mistakes];
    let s = 0;
    let hitLine = "";
    toks.forEach((w, i) => {
      if (posHit[i]) return void (s += 15);
      const l = lines.find((x) => norm(x).includes(w));
      if (l) (s += 10), (hitLine ||= l);
      else s -= 1000;
    });
    if (s > 0 && hitLine) out.push({ s, line: `- 포지션 노트: ${p.nameKo} ${ROLE_NOTE[n.role]} [포지션 ${p.slug}]\n  ↳ ${hitLine}` });
  }
  return out.sort((a, b) => b.s - a.s).slice(0, 5).map((x) => x.line);
}

function resolveConcept(lib: Library, q: string): Concept | { candidates: Concept[] } {
  const n = norm(q);
  const exact = lib.conceptBySlug.get(q.trim()) ?? lib.concepts.find((c) => norm(c.nameKo) === n || norm(c.nameEn) === n);
  if (exact) return exact;
  const part = lib.concepts.filter((c) => norm(c.nameKo).includes(n) || norm(c.nameEn).includes(n) || n.includes(norm(c.nameKo)));
  if (part.length === 1) return part[0];
  return { candidates: part.length ? part : lib.concepts.filter((c) => [c.summary, ...c.body].some((l) => norm(l).includes(n))).slice(0, 8) };
}

function renderNote(lib: Library, n: PositionNote): string {
  const sec = (title: string, lines: string[], link = false) =>
    lines.length ? `### ${title}\n${bullet(link ? lines.map((l) => withLinks(lib, l)) : lines)}` : "";
  return [
    `## ${ROLE_NOTE[n.role]}${n.role === "standing" ? "" : "에서"}`,
    sec("목표 (순서대로)", n.goals),
    sec("핵심", n.keys),
    sec("상대가 ~하면", n.decisions, true),
    sec("흔한 실수", n.mistakes),
    sec("드릴", n.drills),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function renderConcept(lib: Library, c: Concept): string {
  const kind = c.kind === "principle" ? "원리" : "공부법";
  const pos = c.relatedPositions.map((s) => lib.posBySlug.get(s)?.nameKo ?? s);
  const tech = c.relatedTechniques.map((s) => lib.bySlug.get(s)).filter(Boolean) as Technique[];
  const also = c.seeAlso.map((s) => lib.conceptBySlug.get(s)).filter(Boolean) as Concept[];
  return [
    `# ${c.nameKo} (${c.nameEn}) — ${kind}`,
    c.summary,
    bullet(c.body),
    c.examples.length ? `## 어디서 쓰나\n${bullet(c.examples)}` : "",
    pos.length ? `관련 포지션: ${pos.join(", ")}` : "",
    tech.length ? `관련 기술: ${tech.map((t) => `${t.nameKo} [${t.slug}]`).join(", ")}` : "",
    also.length ? `함께 보기: ${also.map((x) => `${x.nameKo} [concept ${x.slug}]`).join(", ")}` : "",
    `---\n${NOTICE}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function label(lib: Library, t: Technique): string {
  const pos = lib.posBySlug.get(t.position)?.nameKo ?? t.position;
  const meta = [pos, t.kind && KIND_KO[t.kind], t.role && ROLE_KO[t.role]].filter(Boolean).join(" · ");
  const to = t.endsAt.length ? ` → ${t.endsAt.map((s) => lib.posBySlug.get(s)?.nameKo ?? s).join(" / ")}` : "";
  return `${t.nameKo} (${t.nameEn}) — ${meta}${to}`;
}

const bullet = (lines: string[]) => lines.map((l) => `- ${l}`).join("\n");

function renderTechnique(lib: Library, t: Technique, perspective: "attacker" | "defender" | "both"): string {
  const out = [`# ${label(lib, t)}`, t.aliases.length ? `다른 이름: ${t.aliases.join(", ")}` : ""];
  if (perspective !== "defender") {
    out.push(`## 세팅 과정 (오른손잡이 기준)\n${t.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
    if (t.keyPoints.length) out.push(`## 핵심 디테일\n${bullet(t.keyPoints)}`);
    if (t.mistakes.length) out.push(`## 흔한 실수\n${bullet(t.mistakes)}`);
    if (t.ifBlocked.length) out.push(`## 막히면\n${bullet(t.ifBlocked.map((l) => withLinks(lib, l)))}`);
  }
  if (perspective !== "attacker") {
    if (t.defense.length) out.push(`## 방어하는 쪽 (상대 입장)\n${bullet(t.defense)}`);
    else if (perspective === "defender") out.push("## 방어하는 쪽\n(아직 정리되지 않았어요)");
  }
  out.push(`---\n${NOTICE}`);
  return out.filter(Boolean).join("\n\n");
}

type Result = { content: { type: "text"; text: string }[]; isError?: boolean };
const text = (t: string): Result => ({ content: [{ type: "text", text: t.slice(0, 24000) }] });
const fail = (t: string): Result => ({ content: [{ type: "text", text: t }], isError: true });

function guard<A>(fn: (lib: Library, args: A) => Result) {
  return async (args: A): Promise<Result> => {
    try {
      return fn(await loadLibrary(), args);
    } catch {
      return fail("기술 목록을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
  };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "rereroll", version: "0.2.0" }, { instructions: INSTRUCTIONS });
  const readOnly = { readOnlyHint: true, openWorldHint: false } as const;
  const kinds = z.enum(Object.keys(KIND_KO) as [string, ...string[]]);

  server.registerTool(
    "rereroll_search",
    {
      title: "기술 찾기",
      description:
        "한국어 · 영어 이름, 다른 이름, 포지션 이름, 그리고 세팅 과정 · 핵심 · 막히면 · 방어 내용, 개념 카드 · 포지션 노트까지 찾는다. 질문 낱말을 그대로 넣어도 된다(예: \"하프가드 크로스페이스 방어\").",
      inputSchema: {
        query: z.string().min(1).describe("찾을 말. 예: \"올드 스쿨\", \"하프가드 크로스페이스 방어\", \"kimura\""),
        limit: z.number().int().min(1).max(30).optional().describe("최대 개수(기본 10)"),
      },
      annotations: readOnly,
    },
    guard((lib, { query, limit = 10 }: { query: string; limit?: number }) => {
      const hits = search(lib, query);
      const extra = searchExtra(lib, query);
      if (!hits.length && !extra.length) return text(`"${query}" 에 맞는 기술이 없어요. 다른 낱말로 찾아보세요.`);
      const lines = hits.slice(0, limit).map((h) => `- ${label(lib, h.t)} [${h.t.slug}]${h.snippet ? `\n  ↳ ${h.snippet}` : ""}`);
      const parts = [`"${query}" — 기술 ${hits.length}개`, ...lines];
      if (extra.length) parts.push("", "개념 · 포지션 노트:", ...extra);
      return text(parts.join("\n"));
    }),
  );

  server.registerTool(
    "rereroll_get_technique",
    {
      title: "기술 자세히",
      description: "기술 하나의 세팅 과정 · 핵심 디테일 · 흔한 실수 · 막히면 · 방어하는 쪽(상대 입장)을 보여 준다. 오른손잡이 기준.",
      inputSchema: {
        name: z.string().min(1).describe("기술 이름 또는 slug. 예: \"올드 스쿨 스윕\", \"half-guard-pass\""),
        perspective: z.enum(["attacker", "defender", "both"]).optional().describe("거는 쪽 · 막는 쪽 · 둘 다(기본)"),
      },
      annotations: readOnly,
    },
    guard((lib, { name, perspective = "both" }: { name: string; perspective?: "attacker" | "defender" | "both" }) => {
      const r = resolveTechnique(lib, name);
      if ("candidates" in r) {
        if (!r.candidates.length) return fail(`"${name}" 기술을 찾지 못했어요. rereroll_search 로 먼저 찾아보세요.`);
        return text(`"${name}" 후보가 여러 개예요:\n${r.candidates.map((t) => `- ${label(lib, t)} [${t.slug}]`).join("\n")}`);
      }
      return text(renderTechnique(lib, r, perspective));
    }),
  );

  server.registerTool(
    "rereroll_position_options",
    {
      title: "포지션에서 할 수 있는 것",
      description: "포지션 하나에서 시작하는 기술 목록. 위 · 아래(role)와 종류(kind)로 거를 수 있다.",
      inputSchema: {
        position: z.string().min(1).describe("포지션 이름 또는 slug. 예: \"하프가드\", \"백\", \"side-control\""),
        role: z.enum(["top", "bottom", "standing"]).optional().describe("위 · 아래 · 서서"),
        kind: kinds.optional().describe("종류: " + Object.entries(KIND_KO).map(([k, v]) => `${k}=${v}`).join(", ")),
      },
      annotations: readOnly,
    },
    guard((lib, { position, role, kind }: { position: string; role?: string; kind?: string }) => {
      const p = resolvePosition(lib, position);
      if (!p) return fail(`"${position}" 포지션을 찾지 못했어요. rereroll_list_positions 로 목록을 보세요.`);
      const list = lib.techniques.filter(
        (t) => t.position === p.slug && (!role || t.role === role || t.role === "both") && (!kind || t.kind === kind),
      );
      if (!list.length) return text(`${p.nameKo} 에서 조건에 맞는 기술이 없어요.`);
      return text(`${p.nameKo} — ${list.length}개${p.summary ? ` · ${p.summary}` : ""}\n${list.map((t) => `- ${label(lib, t)} [${t.slug}]`).join("\n")}\n\n${NOTICE}`);
    }),
  );

  server.registerTool(
    "rereroll_find_paths",
    {
      title: "포지션 A → B 가는 길",
      description: "출발 포지션에서 도착 포지션까지, 성공하면 이어지는 기술들로 가는 짧은 경로 몇 개.",
      inputSchema: {
        from: z.string().min(1).describe("출발 포지션. 예: \"하프가드\""),
        to: z.string().min(1).describe("도착 포지션. 예: \"백\""),
        max_steps: z.number().int().min(1).max(4).optional().describe("최대 기술 수(기본 3)"),
        limit: z.number().int().min(1).max(10).optional().describe("경로 개수(기본 5)"),
      },
      annotations: readOnly,
    },
    guard((lib, { from, to, max_steps = 3, limit = 5 }: { from: string; to: string; max_steps?: number; limit?: number }) => {
      const a = resolvePosition(lib, from);
      const b = resolvePosition(lib, to);
      if (!a || !b) return fail(`포지션을 찾지 못했어요: ${!a ? from : to}`);
      const edges = new Map<string, Technique[]>();
      for (const t of lib.techniques) for (const e of t.endsAt) if (e !== t.position) (edges.get(t.position) ?? edges.set(t.position, []).get(t.position)!).push(t);
      const paths: Technique[][] = [];
      const seen = new Set<string>(); // 같은 기술 순서는 한 번만
      let frontier: { at: string; path: Technique[] }[] = [{ at: a.slug, path: [] }];
      for (let d = 0; d < max_steps && paths.length < limit; d++) {
        const next: typeof frontier = [];
        for (const f of frontier) {
          for (const t of edges.get(f.at) ?? []) {
            for (const e of t.endsAt) {
              if (f.path.some((x) => x.position === e) || e === a.slug) continue;
              const path = [...f.path, t];
              if (e === b.slug) {
                const key = path.map((x) => x.slug).join(">");
                if (paths.length < limit && !seen.has(key)) (seen.add(key), paths.push(path));
              } else next.push({ at: e, path });
            }
          }
        }
        frontier = next.slice(0, 400);
      }
      if (!paths.length) return text(`${a.nameKo} → ${b.nameKo}: ${max_steps}단계 안의 경로를 찾지 못했어요.`);
      const lines = paths.map(
        (p, i) => `${i + 1}. ${p.map((t) => `${t.nameKo}(${lib.posBySlug.get(t.position)?.nameKo} → ${t.endsAt.map((s) => lib.posBySlug.get(s)?.nameKo).join("/")})`).join(" ⟶ ")}`,
      );
      return text(`${a.nameKo} → ${b.nameKo}\n${lines.join("\n")}\n\n자세한 방법은 rereroll_get_technique 로.\n${NOTICE}`);
    }),
  );

  server.registerTool(
    "rereroll_get_position",
    {
      title: "포지션 자세히",
      description:
        "포지션 하나의 설명 · 갈래(변형)와, 위 · 아래(서서) 각각의 목표 · 핵심 · \"상대가 ~하면 → 기술\" · 흔한 실수 · 드릴. \"여기서 뭘 해야 해?\" 에 먼저 쓴다. 오른손잡이 기준.",
      inputSchema: {
        position: z.string().min(1).describe("포지션 이름 또는 slug. 예: \"하프가드\", \"사이드\", \"mount\""),
        role: z.enum(["top", "bottom", "both"]).optional().describe("위 · 아래 · 둘 다(기본). 스탠딩 · 클린치는 하나뿐"),
      },
      annotations: readOnly,
    },
    guard((lib, { position, role = "both" }: { position: string; role?: "top" | "bottom" | "both" }) => {
      const p = resolvePosition(lib, position);
      if (!p) return fail(`"${position}" 포지션을 찾지 못했어요. rereroll_list_positions 로 목록을 보세요.`);
      const notes = lib.notes.filter((n) => n.position === p.slug && (role === "both" || n.role === role || n.role === "standing"));
      const count = lib.techniques.filter((t) => t.position === p.slug).length;
      const out = [
        `# ${p.nameKo} (${p.nameEn})`,
        p.summary,
        p.variants.length ? `## 갈래\n${bullet(p.variants)}` : "",
        ...notes.map((n) => renderNote(lib, n)),
        notes.length ? "" : "(이 포지션 노트는 아직 정리되지 않았어요)",
        `이 포지션 기술 ${count}개 — rereroll_position_options 로 목록.`,
        `---\n${NOTICE}`,
      ];
      return text(out.filter(Boolean).join("\n\n"));
    }),
  );

  server.registerTool(
    "rereroll_get_concept",
    {
      title: "개념 · 원리 자세히",
      description:
        "프레임 · 베이스 · 언더훅 · 압박 · 쿠즈시 · 포지션 서열 같은 원리, 포지션 스파링 · 지면서 배우기 같은 공부법 카드 하나. 무엇 · 왜 · 어떻게 · 흔한 오해 · 어디서 쓰나 · 관련 기술.",
      inputSchema: { name: z.string().min(1).describe("개념 이름 또는 slug. 예: \"프레임\", \"언더훅\", \"positional-sparring\"") },
      annotations: readOnly,
    },
    guard((lib, { name }: { name: string }) => {
      const r = resolveConcept(lib, name);
      if ("candidates" in r) {
        if (!r.candidates.length) return fail(`"${name}" 개념을 찾지 못했어요. rereroll_list_concepts 로 목록을 보세요.`);
        return text(`"${name}" 후보:\n${r.candidates.map((c) => `- ${c.nameKo} (${c.nameEn}) [${c.slug}] — ${c.summary}`).join("\n")}`);
      }
      return text(renderConcept(lib, r));
    }),
  );

  server.registerTool(
    "rereroll_list_concepts",
    {
      title: "개념 목록",
      description: "원리(몸 쓰는 법) · 공부법(훈련 · 마음가짐) 카드 목록과 한 줄 설명.",
      inputSchema: { kind: z.enum(["principle", "learning"]).optional().describe("principle=원리 · learning=공부법(기본 둘 다)") },
      annotations: readOnly,
    },
    guard((lib, { kind }: { kind?: "principle" | "learning" }) => {
      const list = lib.concepts.filter((c) => !kind || c.kind === kind);
      if (!list.length) return text("아직 개념 카드가 없어요.");
      const group = (k: Concept["kind"], title: string) => {
        const g = list.filter((c) => c.kind === k);
        return g.length ? `## ${title} ${g.length}개\n${g.map((c) => `- ${c.nameKo} [${c.slug}] — ${c.summary}`).join("\n")}` : "";
      };
      return text([group("principle", "원리"), group("learning", "공부법"), NOTICE].filter(Boolean).join("\n\n"));
    }),
  );

  server.registerTool(
    "rereroll_list_positions",
    {
      title: "포지션 목록",
      description: "리리롤 포지션 21개와 포지션마다 기술 수.",
      inputSchema: {},
      annotations: readOnly,
    },
    guard((lib) => {
      const n = new Map<string, number>();
      for (const t of lib.techniques) n.set(t.position, (n.get(t.position) ?? 0) + 1);
      return text(lib.positions.map((p) => `- ${p.nameKo} (${p.nameEn}) [${p.slug}] — ${n.get(p.slug) ?? 0}개${p.summary ? ` · ${p.summary}` : ""}`).join("\n") + `\n\n${NOTICE}`);
    }),
  );

  return server;
}
