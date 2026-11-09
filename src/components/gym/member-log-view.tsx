"use client";

import { useState, useTransition } from "react";
import { TechniqueModal } from "@/components/gym/technique-modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BottomAction } from "@/components/app/bottom-action";
import { PositionPicture } from "@/components/app/position-picture";
import { addComment, deleteComment, editComment } from "@/app/gym/actions";
import type { MemberLog } from "@/lib/gym-data";
import { formatKoreanDate } from "@/lib/seoul-date";

// 관원 기록 · 코멘트 (DESIGN '관장님 버전') — 기록 카드(읽기) → 코멘트 묶음(라임 세로 선) → 아래 고정 글칸 + "남기기"
export function MemberLogView({ data }: { data: MemberLog }) {
  const router = useRouter();
  const { log, gym } = data;
  const [draft, setDraft] = useState("");
  const [tech, setTech] = useState<string | null>(null); // 기술 팝업(D-136)
  const [sending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [busy, startBusy] = useTransition();

  function send() {
    const b = draft.trim();
    if (!b) return;
    start(async () => {
      const res = await addComment(gym.id, log.id, b).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "남기지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      toast.success("코멘트를 남겼어요 — 관원에게 알림이 가요");
      setDraft("");
      router.refresh();
    });
  }
  function saveEdit(id: string) {
    startBusy(async () => {
      const res = await editComment(id, editDraft).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "고치지 못했어요.");
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }
  function remove(id: string) {
    startBusy(async () => {
      const res = await deleteComment(id).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "지우지 못했어요.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="관원으로" className="-ml-2 rounded-full">
          <Link href={`/gym/members/${log.userId}`}>
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </Link>
        </Button>
        <h1 className="text-[22px] font-bold tracking-tight">{log.nick} 님의 기록</h1>
        <span className="text-[13px] font-medium text-muted-foreground">
          {formatKoreanDate(log.loggedOn)}
          {log.sparring > 0 ? ` · 스파링 ${log.sparring}판` : ""}
        </span>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold">배운 기술</h2>
        {log.techniques.length === 0 && <p className="text-[15px] text-muted-foreground">고른 기술이 없는 기록이에요.</p>}
        {log.techniques.map((t, i) => {
          const body = (
            <CardContent className="flex items-start gap-3">
              <PositionPicture slug={t.positionSlug} size={56} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[17px] font-semibold">
                  <span className="mark-lime">{t.nameKo}</span>
                </span>
                {(t.nameEn || t.position) && <span className="text-[13px] font-medium text-muted-foreground">{[t.nameEn, t.position].filter(Boolean).join(" · ")}</span>}
                {!t.public && <Badge variant="outline">{t.slug ? "관원이 만든 기술" : "목록에 없는 기술"}</Badge>}
              </div>
            </CardContent>
          );
          return t.public && t.slug ? (
            <button key={i} type="button" onClick={() => setTech(t.slug)} className="block w-full rounded-2xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <Card className="rounded-2xl ring-border transition-colors hover:bg-muted">{body}</Card>
            </button>
          ) : (
            <Card key={i} className="rounded-2xl ring-border">
              {body}
            </Card>
          );
        })}
      </section>

      {log.body && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[17px] font-semibold">메모</h2>
          <Card className="rounded-2xl ring-border">
            <CardContent className="text-[15px] leading-relaxed whitespace-pre-wrap">{log.body}</CardContent>
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">코멘트 {log.comments.length > 0 && <span className="text-[13px] font-medium text-muted-foreground tabular-nums">{log.comments.length}</span>}</h2>
        {log.comments.length === 0 && <p className="text-[13px] text-muted-foreground">아직 코멘트가 없어요. 아래에 한마디 남겨 보세요.</p>}
        <ul className="flex flex-col gap-3">
          {log.comments.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 border-l-2 border-accent pl-3">
              <span className="flex items-baseline gap-2">
                <span className="text-[13px] font-semibold">{c.author}</span>
                <span className="text-[12px] text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
                </span>
                {c.mine && editingId !== c.id && (
                  <span className="ml-auto flex gap-1">
                    <button
                      type="button"
                      className="text-[12px] text-muted-foreground underline-offset-4 hover:underline"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditDraft(c.body);
                      }}
                    >
                      고치기
                    </button>
                    <button type="button" className="text-[12px] text-muted-foreground underline-offset-4 hover:underline" disabled={busy} onClick={() => remove(c.id)}>
                      지우기
                    </button>
                  </span>
                )}
              </span>
              {editingId === c.id ? (
                <div className="flex flex-col gap-2">
                  <Textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value.slice(0, 500))} className="min-h-20 rounded-xl text-base" />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditingId(null)}>
                      취소
                    </Button>
                    <Button size="sm" className="rounded-full" disabled={busy || !editDraft.trim()} onClick={() => saveEdit(c.id)}>
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{c.body}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <BottomAction>
        <div className="flex items-end gap-2 rounded-2xl bg-background p-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 500))}
            placeholder="관원에게 한마디"
            aria-label="코멘트"
            rows={1}
            className="min-h-11 flex-1 resize-none rounded-xl text-base"
          />
          <Button className="h-11 rounded-full px-4" disabled={!draft.trim() || sending} onClick={send}>
            {sending && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
            남기기
          </Button>
        </div>
      </BottomAction>
      <TechniqueModal slug={tech} onClose={() => setTech(null)} />
    </div>
  );
}
