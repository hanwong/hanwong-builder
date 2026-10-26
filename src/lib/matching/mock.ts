import "server-only";
import { candidates, positionNames, type Candidate } from "./library";
import type { RawMatch } from "./types";

// 연습용 예시 매칭 — Claude 키가 없을 때. 글 속에 기술 이름 · 별칭이 그대로 나오면 찾는다.
// 이름 없이 동작으로만 설명한 건 못 찾는다(그건 Claude 가 한다).

const SEP = /[\s·.,!?~()\-/]/;
const norm = (s: string) => s.toLowerCase().split("").filter((c) => !SEP.test(c)).join("");

// 띄어쓰기를 지운 글 + 각 글자가 단어 첫 글자인지. 이름은 단어 첫머리에서만 찾는다
// ("하셨다. 스파링" 이 "다스" 로 잡히지 않게).
function prepare(body: string) {
  let text = "";
  const wordStart: boolean[] = [];
  let prevSep = true;
  for (const c of body.toLowerCase()) {
    if (SEP.test(c)) {
      prevSep = true;
      continue;
    }
    text += c;
    wordStart.push(prevSep);
    prevSep = false;
  }
  return { text, wordStart };
}

const GENERIC_TAIL = ["패스", "가드", "스윕", "초크"];
const POSITIONS = new Set(positionNames.map(norm));

type Key = { text: string; full: boolean };

function keysOf(t: Candidate): Key[] {
  const keys: Key[] = [{ text: norm(t.nameKo), full: true }];
  const base = t.nameKo.split(" (")[0];
  if (base !== t.nameKo) keys.push({ text: norm(base), full: false });
  // "니슬라이스 패스" → "니슬라이스" 로도 찾는다
  const words = base.split(" ");
  if (words.length > 1 && GENERIC_TAIL.includes(words[words.length - 1]) && !POSITIONS.has(norm(base))) {
    const head = words.slice(0, -1).join(" ");
    if (norm(head).length >= 3) keys.push({ text: norm(head), full: false });
  }
  for (const a of t.aliases) keys.push({ text: norm(a), full: true });
  const en = norm(t.nameEn);
  if (en.length >= 6) keys.push({ text: en, full: true });
  // 포지션 이름 자체("클로즈드 가드에서")는 기술로 치지 않는다
  return keys.filter((k) => k.text.length >= 2 && !POSITIONS.has(k.text));
}

// 괄호 속 상황 단어("데라히바 상대" → 데라히바) — 글에 함께 나오면 그 변형을 고른다
function contextWords(t: Candidate): string[] {
  const m = t.nameKo.match(/\(([^)]+)\)/);
  if (!m) return [];
  return m[1]
    .split(/[\s·]+/)
    .filter((w) => w.length >= 2 && !["상대", "에서", "잡힌", "채", "열고", ...GENERIC_TAIL].includes(w))
    .map(norm);
}

const index = candidates.map((t) => ({ t, keys: keysOf(t), ctx: contextWords(t) }));

const GLOSSARY: { term: string; keys: string[]; meaning: string }[] = [
  { term: "언더훅", keys: ["언더훅"], meaning: "상대 겨드랑이 밑으로 팔을 넣어 감는 것" },
  { term: "오버훅", keys: ["오버훅", "위저"], meaning: "상대 팔 위로 내 팔을 감아 누르는 것" },
  { term: "그립", keys: ["그립"], meaning: "도복 · 손목 · 팔을 잡는 방법" },
  { term: "프레임", keys: ["프레임"], meaning: "팔 · 다리를 뼈대처럼 세워 거리를 지키는 것" },
  { term: "새우빼기", keys: ["쉬림프", "새우빼기", "힙이스케이프"], meaning: "옆으로 누워 엉덩이를 빼며 공간을 만드는 움직임" },
  { term: "브릿지", keys: ["브릿지", "업파"], meaning: "엉덩이를 높이 들어 상대를 띄우는 것" },
  { term: "베이스", keys: ["베이스"], meaning: "넘어지지 않게 버티는 자세 · 무게 중심" },
  { term: "포스트", keys: ["포스트"], meaning: "손 · 발을 바닥에 짚어 넘어지지 않게 버티는 것" },
  { term: "크로스페이스", keys: ["크로스페이스"], meaning: "팔뚝으로 상대 얼굴을 반대쪽으로 돌려 누르는 것" },
  { term: "칼라", keys: ["칼라", "깃"], meaning: "도복 깃. 칼라를 잡아 끌거나 조른다" },
  { term: "소매", keys: ["소매", "슬리브"], meaning: "도복 소매. 잡으면 상대 팔을 묶을 수 있다" },
  { term: "패스", keys: ["패스"], meaning: "상대 다리(가드)를 넘어 사이드나 마운트로 가는 것" },
  { term: "스윕", keys: ["스윕"], meaning: "아래에서 상대를 뒤집어 위로 올라가는 것" },
  { term: "탭", keys: ["탭"], meaning: "졌다는 표시로 상대나 바닥을 두드리는 것" },
  { term: "훅", keys: ["훅"], meaning: "발등 · 발목을 상대 다리에 걸어 조종하는 것" },
];

export async function mockMatch(body: string): Promise<RawMatch> {
  const { text, wordStart } = prepare(body);
  const find = (key: string) => {
    for (let i = text.indexOf(key); i >= 0; i = text.indexOf(key, i + 1)) if (wordStart[i]) return i;
    return -1;
  };

  type Hit = { slug: string; score: number; start: number; end: number };
  const hits: Hit[] = [];
  for (const { t, keys, ctx } of index) {
    let best: Hit | null = null;
    for (const k of keys) {
      const start = find(k.text);
      if (start < 0) continue;
      const score =
        k.text.length * 10 +
        (k.full ? 5 : 0) +
        (t.nameKo.includes("(") ? 0 : 2) +
        ctx.filter((w) => text.includes(w)).length * 3;
      if (!best || score > best.score) best = { slug: t.slug, score, start, end: start + k.text.length };
    }
    if (best) hits.push(best);
  }

  // 같은 글자 자리에는 가장 잘 맞는 기술 하나만
  const taken: Hit[] = [];
  for (const h of hits.sort((a, b) => b.score - a.score)) {
    if (taken.some((o) => h.start < o.end && o.start < h.end)) continue;
    taken.push(h);
  }
  const slugs = taken
    .sort((a, b) => a.start - b.start)
    .slice(0, 8)
    .map((h) => h.slug);

  const terms = GLOSSARY.filter((g) => g.keys.some((k) => find(norm(k)) >= 0))
    .slice(0, 6)
    .map(({ term, meaning }) => ({ term, meaning }));

  return { slugs, guesses: [], terms }; // 연습용은 추측하지 않는다
}
