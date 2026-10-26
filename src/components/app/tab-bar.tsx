"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, PenLine, Layers, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// 하단 탭 4개 (DESIGN.md 4). 내 기술은 T-10 에서 화면이 생긴다.
const tabs = [
  { href: "/app", label: "홈", Icon: House, ready: true },
  { href: "/app/log", label: "기록", Icon: PenLine, ready: true },
  { href: "/app/review", label: "복습", Icon: Layers, ready: true },
  { href: "/app/skills", label: "내 기술", Icon: Map, ready: false },
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
        {tabs.map(({ href, label, Icon, ready }) => {
          const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          const cls = cn(
            "flex flex-col items-center gap-1 rounded-xl py-1 text-[12px] font-medium",
            active ? "text-foreground" : "text-muted-foreground",
            !ready && "opacity-40",
          );
          const inner = (
            <>
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              {label}
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
