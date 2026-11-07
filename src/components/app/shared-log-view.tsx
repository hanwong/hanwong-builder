"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomAction } from "@/components/app/bottom-action";
import { PositionPicture } from "@/components/app/position-picture";
import { importSharedLog } from "@/app/app/log/actions";
import { formatKoreanDate } from "@/lib/seoul-date";
import type { SharedLog } from "@/lib/shared-log-data";

// 같이 수업한 사람이 올린 수업 링크를 열었을 때 (D-123) — 날짜 · 기술 · 올린 사람 닉네임만 보이고(메모 · 스파링 없음),
// "내 기록으로 가져오기" 한 번이면 날짜 · 기술이 복사된 내 기록이 생긴다. 이미 가져왔으면 내 기록으로 가는 버튼만.
export function SharedLogView({ log }: { log: SharedLog }) {
  const router = useRouter();
  const [importing, start] = useTransition();
  const count = log.techniques.length + log.customNames.length;

  function take() {
    start(async () => {
      const res = await importSharedLog(log.id).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "가져오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      toast.success("내 기록으로 가져왔어요. 메모는 내 것으로 고쳐도 돼요.");
      router.replace(`/app/log/${res.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="홈으로" className="-ml-2 rounded-full">
          <Link href="/app">
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </Link>
        </Button>
        <h1 className="text-[22px] font-bold tracking-tight">{log.nick ? `${log.nick} 님의 수업` : "같이 한 수업"}</h1>
        <span className="ml-auto text-[13px] font-medium text-muted-foreground">{formatKoreanDate(log.loggedOn)}</span>
      </header>

      <p className="text-[15px] leading-relaxed text-muted-foreground">
        같이 수업한 사람이 보낸 링크예요. 가져오면 같은 날짜 · 기술 · 메모로 내 기록이 생기고, 메모는 내 것으로 고칠 수 있어요.
      </p>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold">배운 기술</h2>
          {count > 0 && (
            <span className="ml-auto text-[13px] font-medium text-muted-foreground tabular-nums">{count}개</span>
          )}
        </div>

        {log.techniques.map((t) => {
          const body = (
            <CardContent className="flex items-start gap-3">
              <PositionPicture slug={t.positionSlug} size={64} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[17px] font-semibold">
                  <span className="mark-lime">{t.nameKo}</span>
                </span>
                <span className="text-[13px] font-medium text-muted-foreground">
                  {t.nameEn} · {t.position}
                </span>
                {!t.public && <Badge variant="outline">올린 사람이 만든 기술 — 이름만 가져와요</Badge>}
              </div>
            </CardContent>
          );
          // 공용 기술은 기술 상세로 이어진다(세팅 과정 · 규정 · 안전). 올린 사람만 보는 기술은 이름만
          return t.public ? (
            <Link key={t.slug} href={`/app/skills/${t.slug}`} className="block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <Card className="rounded-2xl ring-border">{body}</Card>
            </Link>
          ) : (
            <Card key={t.slug} className="rounded-2xl ring-border">
              {body}
            </Card>
          );
        })}

        {log.customNames.map((name) => (
          <Card key={name} className="rounded-2xl ring-border" size="sm">
            <CardContent className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{name}</span>
              <Badge variant="outline">목록에 없는 기술</Badge>
            </CardContent>
          </Card>
        ))}

        {count === 0 && <p className="text-[15px] text-muted-foreground">고른 기술이 없는 기록이에요.</p>}
      </section>

      {/* 수업 메모 (D-124) — 올린 사람이 적은 그대로, 읽기만 */}
      {log.body && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold">메모</h2>
          <Card className="rounded-2xl ring-border">
            <CardContent className="text-[15px] leading-relaxed whitespace-pre-wrap">{log.body}</CardContent>
          </Card>
        </section>
      )}

      <BottomAction>
        {log.importedId ? (
          <Button asChild className="h-12 w-full rounded-full text-base shadow-none">
            <Link href={`/app/log/${log.importedId}`}>이미 가져왔어요 · 내 기록 보기</Link>
          </Button>
        ) : (
          <Button className="h-12 w-full rounded-full text-base shadow-none" disabled={importing || log.owner} onClick={take}>
            {importing ? (
              <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />
            ) : (
              <Download data-icon="inline-start" aria-hidden />
            )}
            내 기록으로 가져오기
          </Button>
        )}
      </BottomAction>
    </div>
  );
}
