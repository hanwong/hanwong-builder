import { House, PenLine, Layers, Map } from "lucide-react";

// 제품(/app) 공통 틀: 휴대폰 폭 한 열 + 하단 탭 4개 (DESIGN.md 4).
// 탭 연결은 5단계(T-21)에서. 지금은 "기록"만 활성.
const tabs = [
  { label: "홈", Icon: House, active: false },
  { label: "기록", Icon: PenLine, active: true },
  { label: "복습", Icon: Layers, active: false },
  { label: "내 기술", Icon: Map, active: false },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          {tabs.map(({ label, Icon, active }) => (
            <li key={label} className="flex-1">
              <span
                aria-current={active ? "page" : undefined}
                className={
                  "flex flex-col items-center gap-1 rounded-xl py-1 text-[12px] font-medium " +
                  (active ? "text-foreground" : "text-muted-foreground")
                }
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {label}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
