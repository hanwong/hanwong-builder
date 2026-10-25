import type { Metadata } from "next";
import { LogReview } from "@/components/app/log-review";
import { seedLog } from "@/lib/mock/log-seed";

export const metadata: Metadata = {
  title: "오늘 배운 것 — Re:Re:롤",
};

// 4단계 대표 화면: 오늘 배운 것 기록 — 상태 C(확인). 가짜 데이터로 모양만 본다.
// 5단계(T-05~T-08)에서 상태 A·B 와 서버 저장을 붙인다.
export default function LogPage() {
  return <LogReview initial={seedLog} />;
}
