"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { House, PenLine, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// 하단 탭 3개 (DESIGN.md 4). 복습 탭은 D-58 로 뺐다.
const tabs = [
  { href: "/app", label: "홈", Icon: House, ready: true, match: undefined },
  { href: "/app/logs", label: "기록", Icon: PenLine, ready: true, match: "/app/log" }, // 목록 · 쓰기 · 보기 모두(D-40)
  { href: "/app/skills", label: "내 기술", Icon: Map, ready: true, match: undefined },
];

export function TabBar() {
  const pathname = usePathname();
  if (pathname === "/app/login") return null; // 로그인 화면은 탭 없이 카드 하나만
  return <TabBarView pathname={pathname} />;
}

// 주소를 읽기 전(기록 보기처럼 주소가 요청마다 다른 화면) 잠깐 보여 줄 탭 — 선택 표시만 없다
export function TabBarFallback() {
  return <TabBarView pathname="" />;
}

function TabBarView({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex h-(--tabbar-h) max-w-md items-center justify-around px-2">
        {tabs.map(({ href, label, Icon, ready, match }) => {
          const active = href === "/app" ? pathname === "/app" : pathname.startsWith(match ?? href);
          const cls = cn(
            "flex flex-col items-center gap-1 rounded-xl py-1 text-[12px] font-medium",
            active ? "text-foreground" : "text-muted-foreground",
            !ready && "opacity-40",
          );
          const inner = (
            <>
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              {label}
              {ready && <PendingBar />}
            </>
          );
          return (
            <li key={href} className="flex-1">
              {ready ? (
                <Link href={href} aria-current={active ? "page" : undefined} className={cls}>
                  {inner}
                </Link>
              ) : (
                <span aria-disabled className={cls} title="곧 생겨요">
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// 탭을 눌렀는데 아직 넘어가는 중이면(미리 받기가 덜 끝났을 때) 글자 아래 짧은 막대 — 0.1초 넘게 걸릴 때만 보인다.
// 자리는 늘 차지해서 글자가 흔들리지 않는다. <Link> 안에서만 쓸 수 있다(useLinkStatus).
function PendingBar() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className="h-0.5 w-4 rounded-full bg-foreground transition-opacity"
      style={{ opacity: pending ? 1 : 0, transitionDelay: pending ? "100ms" : "0ms" }}
    />
  );
}
