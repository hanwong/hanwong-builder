// 기록 화면에서 쓰는 숙련도 · 매칭 결과 모양. (4단계 가짜 기록 seedLog 는 T-06 에서 서버 매칭으로 바꿔 지웠다.)

export type Level = "beginner" | "novice" | "intermediate" | "advanced" | "pro";

export const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "비기너" },
  { value: "novice", label: "초보" },
  { value: "intermediate", label: "중급" },
  { value: "advanced", label: "고급" },
  { value: "pro", label: "프로" },
];

export type MatchedTechnique = {
  id: string;
  nameKo: string;
  nameEn: string;
  position: string;
  positionSlug?: string; // 포지션 그림(public/positions/{slug}.png, D-54)
  steps: string[];
  level: Level;
  draft?: boolean; // 검수 전 초안(D-21) — 카드에 "검수 전" 표시
  guess?: boolean; // 포지션이 없어 추측한 기술(D-23) — "○○에서 배웠다면"
  mine?: "pending" | "rejected"; // 내가 AI 로 만든 기술(D-57) — 승인 대기 · 나만 보기
};

// 내가 만든 기술(D-57) 표시 — 승인 전에는 만든 사람에게만 보인다
export const MINE_LABEL = { pending: "승인 대기", rejected: "나만 보기" } as const;
export const mineOf = (owner: string | null, status: string | null) =>
  owner ? (status === "rejected" ? ("rejected" as const) : ("pending" as const)) : undefined;

export type Term = { term: string; meaning: string };
