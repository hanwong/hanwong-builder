import type { Metadata } from "next";
import { OpenMat } from "@/components/open-mat/open-mat";

// 온라인 오픈매트 (D-88, FLOW `/open-mat`) — 로그인 보호 밖. 링크만 있으면 누구나 들어온다.
export const metadata: Metadata = {
  title: "온라인 오픈매트 — Re:Re:롤",
  description: "도복 입은 캐릭터로 매트에 모여 오스 · 하이파이브 · 탭. 지금 수련 중인 사람들과 함께해요.",
};

export default function OpenMatPage() {
  return <OpenMat />;
}
