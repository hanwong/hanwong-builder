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
  steps: string[];
  level: Level;
  draft?: boolean; // 검수 전 초안(D-21) — 카드에 "검수 전" 표시
};

export type Term = { term: string; meaning: string };
