// 복습 간격 규칙 (D-09, 안키식) — 서버 계산과 화면의 "○일 뒤" 표시가 같은 함수를 쓴다.
export const INTERVAL_DAYS = [1, 3, 7, 14, 30] as const; // 단계 0~4

export type Rating = "again" | "hard" | "good" | "easy";

export const RATINGS: { value: Rating; label: string }[] = [
  { value: "again", label: "다시" },
  { value: "hard", label: "어려움" },
  { value: "good", label: "보통" },
  { value: "easy", label: "쉬움" },
];

// 다시 = 처음(1일), 어려움 = 같은 단계, 보통 = +1, 쉬움 = +2 (최대 30일)
export function nextStep(step: number, rating: Rating): number {
  const s = Math.min(Math.max(step, 0), 4);
  if (rating === "again") return 0;
  if (rating === "hard") return s;
  if (rating === "good") return Math.min(s + 1, 4);
  return Math.min(s + 2, 4);
}
