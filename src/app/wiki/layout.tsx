import Link from "next/link";
import { BookOpen } from "lucide-react";

// 웹 위키(D-114, FLOW `/wiki`) — 로그인 없이 누구나. 공용 기술 지도만 보여 준다.
export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4">
          <Link href="/wiki" className="flex items-center gap-2 text-[15px] font-semibold">
            <BookOpen className="size-4" strokeWidth={1.75} aria-hidden />
            리리롤 기술 위키
          </Link>
          <Link href="/" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Re:Re:롤 홈
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6">{children}</main>
    </div>
  );
}
