import type { MatchedTechnique, Term } from "@/lib/mock/log-seed";

// 매칭 엔진(연습용 · Claude)이 돌려주는 날것의 결과. 서버가 slug 를 후보 목록과 대조한다.
// guesses = 글에 포지션이 없어 갈릴 때 포지션별 추측(D-23)
export type RawMatch = { slugs: string[]; guesses: string[]; terms: Term[] };

export type OrganizeResult =
  | { ok: true; isMock: boolean; techniques: MatchedTechnique[]; terms: Term[] }
  | { ok: false; message: string; limit?: true }; // limit = 이번 주 정리하기 한도 초과(D-43) — 실패가 아니라 안내
