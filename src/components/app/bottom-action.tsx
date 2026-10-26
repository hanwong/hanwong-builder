import type { ReactNode } from "react";

// 화면 아래 고정 버튼(정리하기 · 저장 등). 하단 탭(--tabbar-h + 아이폰 홈 막대 자리) 바로 위에 띄운다.
// 탭 높이는 globals.css 의 --tabbar-h 하나로 맞춘다 — 따로 숫자를 쓰면 겹친다.
export function BottomAction({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="h-16" aria-hidden />
      <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] z-10 px-4">
        <div className="mx-auto max-w-md">{children}</div>
      </div>
    </>
  );
}
