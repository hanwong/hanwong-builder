"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFloatingDialog } from "@/lib/use-floating-dialog";

type Card = { file: File; url: string };

// 기록 공유 (D-51) — 서버가 그 기록으로 만든 스토리 크기 이미지를 미리 보여 주고, 휴대폰 공유 창으로 보내거나 저장한다.
// 이미지는 서버 · 어디에도 남지 않는다. 미리 받아 둔 파일로 공유해야 아이폰에서 '누른 직후' 조건을 지킨다.
export function ShareLog({ id, loggedOn }: { id: string; loggedOn: string }) {
  const [open, setOpen] = useState(false);
  const [withBody, setWithBody] = useState(true);
  const [card, setCard] = useState<Card | null>(null);
  const [failed, setFailed] = useState(false);
  const floating = useFloatingDialog(open);

  useEffect(() => {
    if (!open) return;
    let url = "";
    let gone = false;
    fetch(`/app/log/${id}/card${withBody ? "" : "?body=0"}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        if (gone) return;
        url = URL.createObjectURL(blob);
        setCard({ file: new File([blob], `rereroll-${loggedOn}.png`, { type: "image/png" }), url });
      })
      .catch(() => !gone && setFailed(true));
    return () => {
      gone = true;
      if (url) URL.revokeObjectURL(url);
      setCard(null);
      setFailed(false);
    };
  }, [open, withBody, id, loggedOn]);

  const canShare =
    !!card && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [card.file] });

  async function share() {
    if (!card) return;
    try {
      await navigator.share({ files: [card.file] });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // 공유 창을 닫음
      toast.error("공유 창을 열지 못했어요. 미리보기를 길게 눌러 저장해 주세요.");
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="rounded-full px-2.5" onClick={() => setOpen(true)}>
        <Share2 data-icon="inline-start" aria-hidden />
        공유
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          style={{ ...floating, display: "flex", flexDirection: "column", gap: "12px", padding: "14px" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[17px] font-semibold">기록 공유</DialogTitle>
            <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 rounded-full" onClick={() => setOpen(false)}>
              <X />
            </Button>
          </div>
          <DialogDescription className="sr-only">공유할 기록 이미지를 미리 보고 내 글을 넣거나 뺄 수 있어요.</DialogDescription>
          <div className="flex items-center justify-between">
            <Label htmlFor="share-body" className="text-[15px]">
              내 글 넣기
            </Label>
            <Switch id="share-body" checked={withBody} onCheckedChange={setWithBody} />
          </div>

          <div className="flex justify-center">
            {card ? (
              // 카드 높이는 내용마다 달라서(D-51) 미리보기는 이미지 비율 그대로, 최대 높이만 정한다
              // eslint-disable-next-line @next/next/no-img-element -- 방금 받은 이미지(blob) 미리보기
              <img
                src={card.url}
                alt="공유할 기록 이미지 미리보기"
                className="max-h-[min(46dvh,380px)] w-auto max-w-full rounded-xl bg-muted ring-1 ring-border"
              />
            ) : (
              <div className="flex aspect-[3/4] h-[min(46dvh,380px)] flex-col items-center justify-center gap-2 rounded-xl bg-muted px-4 text-center text-[13px] text-muted-foreground ring-1 ring-border">
                {failed ? (
                  "이미지를 만들지 못했어요. 닫고 다시 눌러 주세요."
                ) : (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    이미지 만드는 중…
                  </>
                )}
              </div>
            )}
          </div>

          {/* 버튼 하나(D-53) — 휴대폰은 공유 창(인스타 · 카톡 · '이미지 저장'으로 사진 앱), 공유 창이 없는 컴퓨터는 내려받기 */}
          {card &&
            (canShare ? (
              <Button className="h-12 w-full rounded-full text-base shadow-none" onClick={share}>
                <Share2 data-icon="inline-start" aria-hidden />
                공유하기
              </Button>
            ) : (
              <Button asChild className="h-12 w-full rounded-full text-base shadow-none">
                <a href={card.url} download={card.file.name}>
                  <Download data-icon="inline-start" aria-hidden />
                  이미지 저장
                </a>
              </Button>
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
