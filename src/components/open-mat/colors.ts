import { BELTS, type Belt } from "@/lib/belt";

// 오픈매트 3D 색(D-88, DESIGN '온라인 오픈매트') — 3D 안에서는 CSS 변수를 못 써서 globals.css 토큰 값을 옮겨 적는다.
export const MAT = {
  background: "#1E1F22", // 방 밖(천장 쪽) — 어두운 천장과 같은 색
  mat: "#4F7DB8", // 파란 매트(본인이 보낸 체육관 사진 분위기, 2026-10-30)
  matLine: "#456FA6", // 매트 이음선
  pad: "#F5F5F2", // 벽 패드(흰색)
  padGap: "#C9CCD1", // 패드 사이 틈
  wall: "#D9DCDD", // 패드 위 벽(옅은 회색)
  ceiling: "#1E1F22", // 어두운 노출 천장
  duct: "#2C2E33",
  light: "#FFFFFF", // 길게 이어진 조명
  doorFrame: "#3A3D42", // 유리문 알루미늄 틀
  glass: "#D8E6EE", // 반투명 유리
  handle: "#C9CDD2",
  hall: "#ECEEEF", // 유리 너머 복도
  hallFloor: "#BFC3C7",
  matBorder: "#2B2A26", // 이름표 글자 · 내 이름표 바탕(먹색)
  wallTrim: "#D9D2C2", // 이름표 테두리
  gi: "#F7F7F4",
  giShade: "#E4E3DE",
  skin: "#E9C4A2",
  hair: "#2B2A26",
  shadow: "#000000",
};

// 흰 띠는 흰 도복 위에서 안 보여 조금 어둡게(홈 벨트의 흰 띠 테두리와 같은 생각, D-35)
export const beltColor = (b: string) => (b === "white" ? "#D6D4CB" : (BELTS.find((x) => x.value === b)?.color ?? "#D6D4CB"));
export const isKnownBelt = (b: unknown): b is Belt => BELTS.some((x) => x.value === b);
