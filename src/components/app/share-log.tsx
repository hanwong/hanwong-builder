"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Download, Loader2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFloatingDialog } from "@/lib/use-floating-dialog";
import { setLogShared } from "@/app/app/log/actions";
import { setNick } from "@/app/app/actions";
import { NICK_MAX, cleanNick } from "@/lib/nickname";

type Card = { file: File; url: string };
type Part = "techniques" | "body" | "sparring";
// 카드에 넣을 것(2026-10-31 본인 요청) — 체크로 넣고 빼기
const PARTS: { key: Part; label: string }[] = [
  { key: "techniques", label: "기술 카드" },
  { key: "body", label: "내 글" },
  { key: "sparring", label: "스파링" },
];

// 기록 공유 (D-51) — 서버가 그 기록으로 만든 스토리 크기 이미지를 미리 보여 주고, 휴대폰 공유 창으로 보내거나 저장한다.
// 이미지는 서버 · 어디에도 남지 않는다. 미리 받아 둔 파일로 공유해야 아이폰에서 '누른 직후' 조건을 지킨다.
// 맨 위 "같이 수업한 사람에게 링크"(D-123): 스위치를 켜면 이 기록 주소를 아는 로그인한 사람이 날짜 · 기술 · 내 닉네임을 보고 내 기록으로 가져간다.
// 닉네임이 없으면 먼저 적게 한다. 메모 · 스파링은 링크에 안 나간다.
export function ShareLog({ id, loggedOn, shared: initialShared, nick: initialNick }: { id: string; loggedOn: string; shared: boolean; nick: string }) {
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState(initialShared);
  const [nick, setNickState] = useState(initialNick);
  const [nickDraft, setNickDraft] = useState("");
  const [askNick, setAskNick] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startLink] = useTransition();
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/app/log/${id}`;

  function toggleLink(on: boolean) {
    if (on && !nick) {
      setAskNick(true); // 닉네임부터
      return;
    }
    const prev = shared;
    setShared(on);
    startLink(async () => {
      const res = await setLogShared(id, on).catch(() => null);
      if (!res?.ok) {
        setShared(prev);
        toast.error(res?.message ?? "저장하지 못했어요. 다시 눌러 주세요.");
      }
    });
  }

  function saveNickAndOn() {
    const value = cleanNick(nickDraft);
    if (!value) return;
    startLink(async () => {
      const res = await setNick(value).catch(() => null);
      if (!res?.ok) {
        toast.error("닉네임을 저장하지 못했어요. 다시 적어 주세요.");
        return;
      }
      setNickState(value);
      setAskNick(false);
      toggleLinkAfterNick();
    });
  }
  function toggleLinkAfterNick() {
    setShared(true);
    startLink(async () => {
      const res = await setLogShared(id, true).catch(() => null);
      if (!res?.ok) {
        setShared(false);
        toast.error(res?.message ?? "저장하지 못했어요. 다시 눌러 주세요.");
      }
    });
  }

  async function copyLink() {
    const text = `${nick} 님의 ${loggedOn} 수업 — 리리롤에서 내 기록으로 가져가기`;
    try {
      if (navigator.share && navigator.canShare?.({ url: link })) {
        await navigator.share({ title: "Re:Re:롤 수업 링크", text, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error("복사하지 못했어요. 주소창의 주소를 직접 복사해 주세요.");
    }
  }
  const [parts, setParts] = useState<Record<Part, boolean>>({ techniques: true, body: true, sparring: true });
  const [clear, setClear] = useState(false); // 배경: 흰색(기본) ↔ 투명 스위치(2026-10-31 본인 요청)
  const query = new URLSearchParams([
    ...PARTS.filter((p) => !parts[p.key]).map((p) => [p.key, "0"]),
    ...(clear ? [] : [["bg", "white"]]),
  ]).toString();
  const [card, setCard] = useState<Card | null>(null);
  const [failed, setFailed] = useState(false);
  const floating = useFloatingDialog(open);

  useEffect(() => {
    if (!open) return;
    let url = "";
    let gone = false;
    fetch(`/app/log/${id}/card${query ? `?${query}` : ""}`, { cache: "no-store" })
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
  }, [open, query, id, loggedOn]);

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
      {/* 글자 없이 아이콘만(본인 요청) — 화면 읽기용 이름은 "공유" */}
      <Button variant="outline" size="icon" aria-label="공유" className="size-9 rounded-[10px] bg-card shadow-none" onClick={() => setOpen(true)}>
        <ShareOutIcon className="size-5" />
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
          <DialogDescription className="sr-only">
            같이 수업한 사람에게 보낼 링크를 켜고 복사하거나, 공유할 기록 이미지를 미리 보고 넣을 내용과 배경을 고를 수 있어요.
          </DialogDescription>

          {/* 같이 수업한 사람에게 링크 (D-123) */}
          <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="share-link" className="text-[15px] font-semibold">
                같이 수업한 사람에게 링크
              </Label>
              <Switch id="share-link" checked={shared} onCheckedChange={toggleLink} />
            </div>
            <p className="text-[13px] font-medium text-muted-foreground">
              {shared
                ? `링크를 연 사람(로그인 필요)에게 날짜 · 기술 · 닉네임 "${nick}"이 보이고, 메모와 스파링은 안 보여요. 누르면 자기 기록으로 가져가요.`
                : "켜면 링크를 아는 사람이 날짜 · 기술을 보고 자기 기록으로 가져갈 수 있어요. 메모와 스파링은 안 보여요."}
            </p>
            {askNick && !nick && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="share-nick" className="text-[13px] font-semibold">
                  링크에 보일 닉네임
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="share-nick"
                    value={nickDraft}
                    maxLength={NICK_MAX}
                    autoComplete="off"
                    placeholder="실명이 아니어도 돼요"
                    className="h-10 rounded-xl px-3"
                    onChange={(e) => setNickDraft(e.target.value)}
                  />
                  <Button variant="outline" className="h-10 shrink-0 rounded-full shadow-none" disabled={!cleanNick(nickDraft)} onClick={saveNickAndOn}>
                    저장하고 켜기
                  </Button>
                </div>
              </div>
            )}
            {shared && (
              <Button variant="outline" className="h-10 w-full rounded-full bg-card shadow-none" onClick={copyLink}>
                {copied ? <Check data-icon="inline-start" aria-hidden /> : <Copy data-icon="inline-start" aria-hidden />}
                {copied ? "복사했어요" : "링크 보내기 · 복사"}
              </Button>
            )}
          </div>
          <p className="text-[13px] font-semibold text-muted-foreground">이미지로 공유</p>
          {/* 넣을 것 — 기술 카드 · 내 글 · 스파링 체크 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {PARTS.map((p) => (
              <div key={p.key} className="flex items-center gap-2">
                <Checkbox
                  id={`share-${p.key}`}
                  checked={parts[p.key]}
                  onCheckedChange={(v) => setParts((x) => ({ ...x, [p.key]: v === true }))}
                />
                <Label htmlFor={`share-${p.key}`} className="text-[15px]">
                  {p.label}
                </Label>
              </div>
            ))}
          </div>
          {/* 배경 — 끄면 흰색(기본), 켜면 투명(사진 위에 붙이기) */}
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="share-clear" className="text-[15px]">
              배경 투명
            </Label>
            <Switch id="share-clear" checked={clear} onCheckedChange={setClear} />
          </div>

          <div className="flex justify-center">
            {card ? (
              // 카드 높이는 내용마다 달라서(D-51) 미리보기는 이미지 비율 그대로, 최대 높이만 정한다
              // eslint-disable-next-line @next/next/no-img-element -- 방금 받은 이미지(blob) 미리보기
              <img
                src={card.url}
                alt="공유할 기록 이미지 미리보기"
                className="max-h-[min(46dvh,380px)] w-auto max-w-full rounded-xl ring-1 ring-border"
                // 투명이면 뒤에 격자를 깔아 비치는 걸 보이게(2026-10-31 본인 요청)
                style={clear ? CHECKER : undefined}
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

// 투명 배경 미리보기용 격자(선 색 · 흰 카드색 8px 칸)
const CHECKER = {
  backgroundImage: "conic-gradient(var(--border) 25%, var(--card) 0 50%, var(--border) 0 75%, var(--card) 0)",
  backgroundSize: "16px 16px",
};

// 열린 네모 밖으로 휘어져 나가는 화살표 — lucide 선 굵기 · 둥근 끝과 맞춘 공유 아이콘
function ShareOutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M11 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4" />
      <path d="M9 15c0-4.5 3-7.5 7.5-7.5H21" />
      <path d="m17.5 4 3.5 3.5-3.5 3.5" />
    </svg>
  );
}
