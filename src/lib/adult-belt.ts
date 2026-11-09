import { BELTS, isBelt } from "@/lib/belt";

// 성인 벨트 5개 (D-126) — 서버 · 클라이언트가 함께 쓴다(벨트 목록 데이터 모듈은 서버 전용이라 여기 따로)
export type AdultBelt = "white" | "blue" | "purple" | "brown" | "black";
export const ADULT_BELTS = BELTS.filter((b) => !("youth" in b)) as { value: AdultBelt; label: string; color: string }[];

// 유소년 벨트(그레이 · 옐로 · 오렌지 · 그린)는 화이트 목록을 본다(D-126 ④)
export function adultBeltOf(belt: unknown): AdultBelt {
  if (!isBelt(belt)) return "white";
  const found = ADULT_BELTS.find((b) => b.value === belt);
  return found ? found.value : "white";
}
