import { BELTS, type Belt } from "@/lib/belt";

// 오픈매트 3D 색(D-88, DESIGN '온라인 오픈매트') — 3D 안에서는 CSS 변수를 못 써서 globals.css 토큰 값을 옮겨 적는다.
export const MAT = {
  background: "#F4F1EA", // 크림(--background 와 같은 결)
  wall: "#EDE8DC",
  wallTrim: "#D9D2C2",
  floor: "#CFC8B8", // 매트 밖 나무 바닥
  mat: "#B9C4B4", // 연한 회녹 매트
  matLine: "#A9B5A4",
  matBorder: "#2B2A26", // 먹색 테두리
  gi: "#F7F7F4",
  giShade: "#E4E3DE",
  skin: "#E9C4A2",
  hair: "#2B2A26",
  shadow: "#000000",
};

// 흰 띠는 흰 도복 위에서 안 보여 조금 어둡게(홈 벨트의 흰 띠 테두리와 같은 생각, D-35)
export const beltColor = (b: string) => (b === "white" ? "#D6D4CB" : (BELTS.find((x) => x.value === b)?.color ?? "#D6D4CB"));
export const isKnownBelt = (b: unknown): b is Belt => BELTS.some((x) => x.value === b);
