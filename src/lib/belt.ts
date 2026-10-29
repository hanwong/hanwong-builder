// 수련 벨트 (D-33 · D-34, DESIGN 2) — 홈 그래픽과 서버가 함께 쓰는 값. 벨트 색은 칸지 에어 제품 사진에서 뽑음.
export const BELTS = [
  { value: "white", label: "화이트", color: "#F1F2F0" },
  { value: "blue", label: "블루", color: "#3571AB" },
  { value: "purple", label: "퍼플", color: "#6B4C90" },
  { value: "brown", label: "브라운", color: "#8E5F4B" },
  { value: "black", label: "블랙", color: "#212121" },
  // 유소년 벨트(D-78) — 색 4개만(IBJJF 의 화이트 · 블랙 줄 단계는 나누지 않음)
  { value: "grey", label: "그레이", color: "#9C9C97", youth: true },
  { value: "yellow", label: "옐로", color: "#E8C32E", youth: true },
  { value: "orange", label: "오렌지", color: "#E0782B", youth: true },
  { value: "green", label: "그린", color: "#3F8A4F", youth: true },
] as const;
// 체크 표시를 어두운 색으로 그릴 밝은 벨트
export const LIGHT_BELTS: readonly Belt[] = ["white", "yellow"];
export type Belt = (typeof BELTS)[number]["value"];
export const isBelt = (v: unknown): v is Belt => BELTS.some((b) => b.value === v);

export const BELT_WEEKS = 104; // 최근 2년, 1주 1칸
export const BELT_ROWS = 4; // 4줄 × 26칸
export const BELT_BG = "#0A0A0A"; // 가운데 바탕(요즘 웹의 거의 검정)
export const BELT_BLACK_BAR = "#DE1F2E"; // 블랙 벨트일 때 가운데 바탕 = 칸지 블랙 벨트 랭크바 빨강(D-35)
export const BELT_WHITE_EDGE = "#D4D3CC"; // 화이트 벨트일 때 벨트 전체 테두리(크림 바탕과 구분, D-35)

// 주별 수련 횟수 0 · 1 · 2 · 3 · 4 · 5회 이상 → 5회 이상이 가장 하얗다
export const WEEK_SHADES = ["#1C1C1C", "#3A3A3A", "#5E5E5E", "#8C8C8C", "#C2C2C2", "#FAFAFA"] as const;

// 수련 시작 연 · 월 (D-59) — 'YYYY-MM'. 로그인 계정 정보(user_metadata.started_on)에 벨트와 함께 둔다.
export const isStartMonth = (v: unknown): v is string =>
  typeof v === "string" && /^(19[5-9]\d|20\d\d)-(0[1-9]|1[0-2])$/.test(v);

// "수련 2년 3개월째" — 시작한 달은 "수련 첫 달"
export function trainingSpan(startedOn: string, thisMonth: string): string {
  const [sy, sm] = startedOn.split("-").map(Number);
  const [ty, tm] = thisMonth.split("-").map(Number);
  const months = (ty - sy) * 12 + (tm - sm);
  if (months <= 0) return "수련 첫 달";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `수련 ${[y && `${y}년`, m && `${m}개월`].filter(Boolean).join(" ")}째`;
}

