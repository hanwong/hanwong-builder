import { ViewSwitch } from "@/components/app/logs-view";

// 기록 탭 공통 틀 — 제목 · 목록/달력 전환(질문하기 버튼은 본인 요청으로 뺌, 2026-11-04 — 질문은 베타 홈에서). 목록은 /app/logs, 달력은 /app/logs/cal (D-106).
// 주소 뒤 값(?view= · ?m= · ?n=)을 읽으면 그 화면이 통째로 미리 받기에서 빠져 탭을 누를 때마다 로딩이 보였다(2026-11-01 실측).
export default function LogsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 pb-16">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[22px] font-bold tracking-tight">기록</h1>
      </div>
      <ViewSwitch />
      {children}
    </div>
  );
}
