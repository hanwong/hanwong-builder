"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, PenLine, Layers, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// 하단 탭 4개 (DESIGN.md 4). 복습 · 내 기술은 5단계 T-09 · T-10 에서 화면이 생긴다.
const tabs = [
  { href: "/app", label: "홈", Icon: House, ready: true },
  { href: "/app/log", label: "기록", Icon: PenLine, ready: true },
  { href: "/app/review", label: "복습", Icon: Layers, ready: false },
  { href: "/app/skills", label: "내 기술", Icon: Map, ready: false },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
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
