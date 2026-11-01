import type { PositionNote } from "@/lib/mcp/library-data";

// 기술 종류 · 쓰는 쪽 이름 — 리리롤 MCP 와 위키(D-114)가 같은 말을 쓴다.
export const KIND_KO: Record<string, string> = {
  takedown: "테이크다운",
  guard_pull: "가드 풀링",
  sweep: "스윕",
  pass: "패스",
  submission: "서브미션",
  escape: "탈출",
  back_take: "백 테이크",
  transition: "전환",
  control: "자세 · 컨트롤",
  defense: "방어",
};
export const ROLE_KO: Record<string, string> = { top: "위", bottom: "아래", standing: "서서", both: "위 · 아래" };
export const ROLE_NOTE: Record<PositionNote["role"], string> = { top: "위", bottom: "아래", standing: "서서" };
