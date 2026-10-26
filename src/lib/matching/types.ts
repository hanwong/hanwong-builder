import type { MatchedTechnique, Term } from "@/lib/mock/log-seed";

// 매칭 엔진(연습용 · Claude)이 돌려주는 날것의 결과. 서버가 slug 를 후보 목록과 대조한다.
export type RawMatch = { slugs: string[]; terms: Term[] };

export type OrganizeResult =
  | { ok: true; isMock: boolean; techniques: MatchedTechnique[]; terms: Term[] }
  | { ok: false; message: string };
