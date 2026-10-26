import type { Metadata } from "next";
import { LogFlow } from "@/components/app/log-flow";

export const metadata: Metadata = {
  title: "오늘 배운 것 — Re:Re:롤",
};

// 오늘 배운 것 기록: 상태 A 쓰기(T-05) → B 정리 중 · C 확인(T-06 · T-07 에서 서버 결과로).
export default function LogPage() {
  return <LogFlow />;
}
