"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarDays, Users, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

// 관장 화면 아래 탭 4개 (D-127, DESIGN '관장님 버전') — /app 탭 바와 같은 모양. 체육관 등록 화면에서는 안 보인다.
const tabs: { href: string; label: string; Icon: typeof House }[] = [
  { href: "/gym", label: "홈", Icon: House },
  { href: "/gym/schedule", label: "스케줄", Icon: CalendarDays },
  { href: "/gym/members", label: "관원", Icon: Users },
  { href: "/gym/settings", label: "설정", Icon: Settings2 },
];

export function GymTabBar() {
  const pathname = usePathname();
  if (pathname === "/gym/new") return null;
  return <GymTabBarView pathname={pathname} />;
}

// 주소를 읽기 전(수업 · 관원처럼 주소가 요청마다 다른 화면) 잠깐 보여 줄 탭 — 선택 표시만 없다
export function GymTabBarFallback() {
  return <GymTabBarView pathname="" />;
}

function GymTabBarView({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="관장 메뉴"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex h-(--tabbar-h) max-w-md items-center justify-around px-2">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/gym" ? pathname === "/gym" || pathname.startsWith("/gym/class") : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1 text-[12px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
