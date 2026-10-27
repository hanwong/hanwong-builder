import "server-only";
import { bySlug } from "./library";
import { claudeMatch } from "./claude";
import { mockMatch } from "./mock";
import type { OrganizeResult } from "./types";

// ★ 실제 키로 바꾸는 지점은 여기 하나 ★
// ANTHROPIC_API_KEY 가 .env.local(내 컴퓨터) · Vercel 환경변수(인터넷 주소)에 있으면 Claude, 없으면 연습용 예시.
const LIVE = Boolean(process.env.ANTHROPIC_API_KEY);
export const isLive = () => LIVE; // 실제 Claude 인가(연습용 예시면 false) — 호출 횟수 한도(D-43)에 쓴다

// mode "keyword" = Claude 없이 글 속 기술 이름 · 다른 이름만 우리 목록에서 찾는다(비용 0, D-44)
export async function matchLog(body: string, mode: "auto" | "keyword" = "auto"): Promise<Extract<OrganizeResult, { ok: true }>> {
  const useClaude = LIVE && mode === "auto";
  const raw = useClaude ? await claudeMatch(body) : await mockMatch(body);

  // 존재 검사: 후보 목록에 있는 slug 만, 중복 없이 (DB.md 6). 확실한 것 최대 8 + 추측 최대 4 (D-23)
  const seen = new Set<string>();
  const valid = (list: string[], max: number) =>
    list.filter((s) => bySlug.has(s) && !seen.has(s) && seen.add(s)).slice(0, max);
  const picked = [
    ...valid(raw.slugs, 8).map((slug) => ({ slug, guess: false })),
    ...valid(raw.guesses, 4).map((slug) => ({ slug, guess: true })),
  ];
  const techniques = picked.map(({ slug: s, guess }) => {
    const t = bySlug.get(s)!;
    return {
      id: t.slug,
      nameKo: t.nameKo,
      nameEn: t.nameEn,
      position: t.position,
      steps: t.steps,
      level: "beginner" as const, // 이전 숙련도 불러오기는 T-07 · T-08
      draft: t.draft,
      guess,
    };
  });

  return { ok: true, isMock: !LIVE, keywordOnly: LIVE && !useClaude, techniques, terms: raw.terms.slice(0, 6) };
}
