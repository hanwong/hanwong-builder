import type { Metadata } from "next";
import { LogFlow } from "@/components/app/log-flow";

export const metadata: Metadata = {
  title: "오늘 배운 것 — Re:Re:롤",
};

// 오늘 배운 것 기록 — 기술 먼저 고르고 오늘 메모(D-56).
export default function LogPage() {
  return <LogFlow />;
}
