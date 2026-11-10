import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassForm } from "@/components/gym/class-form";
import { GymEmpty } from "@/components/gym/gym-empty";
import { getNewClassInfo } from "@/lib/gym-data";
import { isIsoDate } from "@/lib/seoul-date";

export const metadata: Metadata = { title: "수업 내용 등록 — Re:Re:롤" };

// 수업 내용 등록 (D-127, FLOW 8-3) — 주소 ?d=날짜&s=규칙. 이 화면은 주소 값을 읽으므로 미리 받기에 안 들어간다(괜찮음 — 관장이 누른 뒤 연다).
export default function NewClassPage({ searchParams }: { searchParams: Promise<{ d?: string; s?: string }> }) {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
      <Loader searchParams={searchParams} />
    </Suspense>
  );
}

async function Loader({ searchParams }: { searchParams: Promise<{ d?: string; s?: string }> }) {
  const { d, s } = await searchParams;
  if (!isIsoDate(d)) notFound();
  if (s && !/^[0-9a-f-]{36}$/i.test(s)) notFound();
  await cookies();
  const info = await getNewClassInfo(d, s ?? null);
  if (!info) return <GymEmpty />;
  // 날짜 · 수업마다 새 칸(D-160) — 같은 화면을 다른 수업으로 다시 열면 앞 수업에 적던 기술 · 메모가 남아 있었다
  return <ClassForm key={`${info.heldOn}-${info.scheduleId ?? "new"}`} gym={info.gym} today={info.today} initial={{ id: null, scheduleId: info.scheduleId, heldOn: info.heldOn, name: info.name, startsAt: info.startsAt, body: "", techniques: [], customNames: [] }} />;
}
