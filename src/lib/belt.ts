// 수련 벨트 (D-33 · D-34, DESIGN 2) — 홈 그래픽과 서버가 함께 쓰는 값. 벨트 색은 칸지 에어 제품 사진에서 뽑음.
export const BELTS = [
  { value: "white", label: "화이트", color: "#F1F2F0" },
  { value: "blue", label: "블루", color: "#3571AB" },
  { value: "purple", label: "퍼플", color: "#6B4C90" },
  { value: "brown", label: "브라운", color: "#8E5F4B" },
  { value: "black", label: "블랙", color: "#212121" },
] as const;
export type Belt = (typeof BELTS)[number]["value"];
export const isBelt = (v: unknown): v is Belt => BELTS.some((b) => b.value === v);

export const BELT_WEEKS = 104; // 최근 2년, 1주 1칸
export const BELT_ROWS = 4; // 4줄 × 26칸
export const BELT_BG = "#0A0A0A"; // 가운데 바탕(요즘 웹의 거의 검정)

// 주별 수련 횟수 0 · 1 · 2 · 3 · 4 · 5회 이상 → 5회 이상이 가장 하얗다
export const WEEK_SHADES = ["#1C1C1C", "#3A3A3A", "#5E5E5E", "#8C8C8C", "#C2C2C2", "#FAFAFA"] as const;
