"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNoticesRead } from "@/app/app/actions";
import type { HomeNotices } from "@/lib/notices-data";

// 내 알림 — "확인"을 누르면 바로 숨기고 읽음으로 저장한다(실패하면 다음에 다시 보인다)
export function NoticeList({ notices }: { notices: HomeNotices["notices"] }) {
  const [hidden, setHidden] = useState(false);
  const [, start] = useTransition();
  if (hidden) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3" role="status">
      <ul className="flex flex-col gap-1.5">
        {notices.map((n) => (
          <li key={n.id} className="flex items-start gap-2 text-[15px]">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            {n.slug ? (
              <Link href={`/app/skills/${n.slug}`} className="underline-offset-4 hover:underline">
                {n.message}
              </Link>
            ) : (
              <span>{n.message}</span>
            )}
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        className="self-end rounded-full text-muted-foreground"
        onClick={() => {
          setHidden(true);
          start(async () => {
            await markNoticesRead(notices.map((n) => n.id));
          });
        }}
      >
        확인
      </Button>
    </div>
  );
}
