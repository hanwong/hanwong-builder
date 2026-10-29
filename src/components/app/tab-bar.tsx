"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { House, PenLine, Map, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// 하단 탭 3개 (DESIGN.md 4). 복습 탭은 D-58 로 뺐다. 홈 · 기록 탭에는 위에 떠 있는 기록하기(D-67).
const tabs = [
  { href: "/app", label: "홈", Icon: House, ready: true, match: undefined },
  { href: "/app/logs", label: "기록", Icon: PenLine, ready: true, match: "/app/log" }, // 목록 · 쓰기 · 보기 모두(D-40)
  { href: "/app/skills", label: "내 기술", Icon: Map, ready: true, match: undefined },
];

export function TabBar() {
  const pathname = usePathname();
  if (pathname === "/app/login" || pathname === "/app/start") return null; // 로그인 · 시작하기(D-59)는 탭 없이 카드 하나만
  return (
    <>
      {(pathname === "/app" || pathname === "/app/logs") && <RecordButton key={pathname} />}
      <TabBarView pathname={pathname} />
    </>
  );
}

// 홈 · 기록 탭에서만 탭 바 바로 위 가운데에 떠 있는 "+ 기록하기"(D-67) — 한 손 엄지가 닿고, 내려도 늘 보인다.
// 화면(main)을 아래로 내리는 동안엔 동그란 + 로 줄어 아래 내용을 덜 가리고, 위로 올리거나 멈추면 다시 펼친다(Material 3).
const EXPAND_AFTER = 900; // 멈추고 이만큼 지나면 다시 펼침(ms)

function RecordButton() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    let last = main.scrollTop;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const y = main.scrollTop;
      if (y > last + 2 && y > 24) setSmall(true);
      else if (y < last - 2) setSmall(false);
      last = y;
      clearTimeout(timer);
      timer = setTimeout(() => setSmall(false), EXPAND_AFTER);
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      main.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <Link
      href="/app/log"
      aria-label="기록하기"
      className={cn(
        "fixed left-1/2 z-30 flex h-12 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-primary text-base font-semibold whitespace-nowrap text-primary-foreground shadow-lg shadow-black/20 transition-[padding,transform] duration-200 ease-out active:scale-95 motion-reduce:transition-none",
        small ? "w-12 px-0" : "px-6",
      )}
      style={{ bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 12px)" }}
    >
      <Plus className="size-5 shrink-0" aria-hidden />
      <span
        aria-hidden
        className={cn(
          "overflow-hidden transition-[max-width,opacity,margin] duration-200 ease-out motion-reduce:transition-none",
          small ? "ml-0 max-w-0 opacity-0" : "ml-1.5 max-w-24 opacity-100",
        )}
      >
        기록하기
      </span>
    </Link>
  );
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
