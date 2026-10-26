import "server-only";
import { bySlug } from "./library";
import { claudeMatch } from "./claude";
import { mockMatch } from "./mock";
import type { OrganizeResult } from "./types";

// ★ 실제 키로 바꾸는 지점은 여기 하나 ★
// ANTHROPIC_API_KEY 가 .env.local(내 컴퓨터) · Vercel 환경변수(인터넷 주소)에 있으면 Claude, 없으면 연습용 예시.
const LIVE = Boolean(process.env.ANTHROPIC_API_KEY);

export async function matchLog(body: string): Promise<Extract<OrganizeResult, { ok: true }>> {
  const raw = LIVE ? await claudeMatch(body) : await mockMatch(body);

  // 존재 검사: 후보 목록에 있는 slug 만, 중복 없이, 최대 8개 (DB.md 6)
  const seen = new Set<string>();
  const techniques = raw.slugs
    .filter((s) => bySlug.has(s) && !seen.has(s) && seen.add(s))
    .slice(0, 8)
    .map((s) => {
      const t = bySlug.get(s)!;
      return {
        id: t.slug,
        nameKo: t.nameKo,
        nameEn: t.nameEn,
        position: t.position,
        steps: t.steps,
        level: "beginner" as const, // 이전 숙련도 불러오기는 T-07 · T-08
        draft: t.draft,
      };
    });

  return { ok: true, isMock: !LIVE, techniques, terms: raw.terms.slice(0, 6) };
}
