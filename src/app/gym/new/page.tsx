import type { Metadata } from "next";
import { GymNewForm } from "@/components/gym/gym-new-form";

export const metadata: Metadata = { title: "체육관 등록 — Re:Re:롤" };

// 체육관 등록 (D-127, FLOW 8-3) — 이름 · 지역 → 가입 코드. 등록한 사람이 관장.
export default function GymNewPage() {
  return <GymNewForm />;
}
