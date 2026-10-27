"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PencilLine, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { suggestEdit } from "@/app/app/skills/actions";
import { useFloatingDialog } from "@/lib/use-floating-dialog";

// 기술 내용 보완 제안 (D-50, FLOW 기술 상세) — 지금 세팅 과정이 채워진 칸을 고치고, 다른 이름을 더해 보낸다.
// 운영자가 확인 · 승인하면 반영되고 홈 알림이 온다.
export function SuggestEdit({ slug, steps, pending }: { slug: string; steps: string[]; pending: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(steps.join("\n"));
  const [aliases, setAliases] = useState("");
  const [reason, setReason] = useState("");
  const [sending, start] = useTransition();
  const floating = useFloatingDialog(open);

  if (pending) {
    return <p className="text-[13px] font-medium text-muted-foreground">보완 제안 확인 대기 중이에요.</p>;
  }

  const lines = text.split("\n").filter((l) => l.trim()).length;

  function send() {
    start(async () => {
      const r = await suggestEdit(slug, { steps: text.split("\n"), aliases: aliases.split(/[,，]/), reason });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      setOpen(false);
      toast.success("보냈어요. 반영되면 알림으로 알려 드려요.");
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start rounded-full px-2 text-muted-foreground"
        onClick={() => {
          setText(steps.join("\n"));
          setOpen(true);
        }}
      >
        <PencilLine data-icon="inline-start" aria-hidden />
        내용 보완 제안
      </Button>
      <Dialog open={open} onOpenChange={(v) => !sending && setOpen(v)}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          style={{ ...floating, display: "flex", flexDirection: "column", gap: "12px", padding: "14px", overscrollBehavior: "contain" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[17px] font-semibold">내용 보완 제안</DialogTitle>
            <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 rounded-full" onClick={() => setOpen(false)}>
              <X />
            </Button>
          </div>
          <DialogDescription className="text-[13px]">
            배운 것과 다른 곳을 고쳐 보내 주세요. 운영자가 확인하고 반영해요.
          </DialogDescription>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="suggest-steps">세팅 과정 (한 줄에 하나, 3~5줄 · 지금 {lines}줄)</Label>
              <Textarea id="suggest-steps" value={text} onChange={(e) => setText(e.target.value.slice(0, 700))} rows={6} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="suggest-aliases">더할 다른 이름 (선택, 쉼표로 구분)</Label>
              <Input
                id="suggest-aliases"
                value={aliases}
                onChange={(e) => setAliases(e.target.value.slice(0, 200))}
                placeholder="예: 우리 체육관에서 부르는 이름"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="suggest-reason">이유 한 줄 (선택)</Label>
              <Input
                id="suggest-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 200))}
                placeholder="예: 3번 줄은 반대 손이에요"
              />
            </div>
          </div>

          <Button className="h-11 w-full rounded-full text-base" disabled={sending || lines < 3 || lines > 5} onClick={send}>
            {sending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
            보내기
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
