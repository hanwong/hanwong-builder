"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { searchTechniques } from "@/app/app/log/actions";
import type { MatchedTechnique } from "@/lib/mock/log-seed";

// 정리 화면 "기술 추가" (D-31) — 우리 목록에서 이름 · 영어 이름 · 다른 이름으로 찾아 고르면 기술 카드로,
// 없으면 이름만 직접 추가 — 운영자 확인 후 라이브러리에 넣고 카드로 바꾼다(D-32). 두 글자부터 찾는다.
// 떠 있는 팝업으로 연다(T-35). 뒤 화면은 붙잡아 두고(position: fixed), 팝업은 키보드 위 보이는 영역 안에 맞추며,
// 결과를 손대는 순간 키보드를 내려 아이폰이 화면을 밀어 올리지 않게 한다 → 뒤는 고정, 안은 자연스러운 스크롤.
export function TechniqueAdder({
  existing,
  onPick,
  onCustom,
}: {
  existing: string[]; // 이미 들어 있는 기술(slug)
  onPick: (t: MatchedTechnique) => void;
  onCustom: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; list: MatchedTechnique[] }>({ q: "", list: [] });
  // 지금 눈에 보이는 영역(휴대폰 키보드 위). 팝업 높이 · 위치를 여기에 맞춘다
  const [visible, setVisible] = useState<{ top: number; height: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const text = query.trim();
  const ready = text.replace(/\s/g, "").length >= 2;
  const loading = ready && results.q !== text;

  // 팝업이 열려 있는 동안 뒤 화면은 고정(T-35). 아이폰 사파리는 overflow 를 막아도 손가락 스크롤이 뒤로
  // 넘어가서, 페이지를 지금 위치 그대로 position: fixed 로 붙잡아 두었다가 닫을 때 같은 위치로 되돌린다.
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const y = window.scrollY;
    const prev = body.getAttribute("style") ?? "";
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.setAttribute("style", prev);
      window.scrollTo(0, y);
    };
  }, [open]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return;
    const update = () => setVisible({ top: vv.offsetTop, height: vv.height });
    const raf = requestAnimationFrame(update);
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setVisible(null);
    };
  }, [open]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const id = setTimeout(async () => {
      const list = await searchTechniques(text).catch(() => []);
      if (alive) setResults({ q: text, list });
    }, 250); // 칠 때마다 부르지 않게 잠깐 기다린다
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [text, ready]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted"
    >
      <Plus className="size-4" strokeWidth={2} aria-hidden />
      기술 추가
    </button>
  );

  const list = ready && results.q === text ? results.list : [];

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          style={{
            // 보이는 영역 맨 위에서 조금 띄우고, 높이는 그 안으로(키보드가 올라와도 제목 · 검색 칸이 안 가림)
            top: visible ? `${visible.top + 12}px` : "max(1rem, 5dvh)",
            translate: "-50% 0", // 가운데 정렬은 유지하고 세로 가운데 이동만 끈다(위쪽에 띄움)
            maxHeight: visible ? `${Math.min(600, visible.height - 24)}px` : "min(75dvh, 600px)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "14px",
            overscrollBehavior: "contain",
          }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[17px] font-semibold">기술 추가</DialogTitle>
            <Button variant="ghost" size="icon" aria-label="기술 추가 닫기" className="-mr-1 rounded-full" onClick={close}>
              <X />
            </Button>
          </div>
          <DialogDescription className="sr-only">기술 이름 · 영어 이름 · 다른 이름으로 찾아 추가해요.</DialogDescription>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 40))}
                placeholder="기술 이름으로 찾기 (예: 시저, 오소토)"
                aria-label="기술 이름으로 찾기"
                className="h-11 w-full rounded-xl border border-input bg-background pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {!ready ? (
            <p className="px-1 text-[13px] font-medium text-muted-foreground">두 글자 이상 적어 주세요.</p>
          ) : loading ? (
            <p className="flex items-center gap-1.5 px-1 text-[13px] font-medium text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              찾는 중…
            </p>
          ) : (
            <ul
              className="-mx-1 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
              // 결과에 손대면 키보드를 먼저 내린다 → 아이폰이 화면을 밀어 올리지 않아 스크롤이 자연스럽다
              onTouchStart={() => {
                if (document.activeElement === inputRef.current) inputRef.current?.blur();
              }}
            >
              {list.map((t) => {
                const already = existing.includes(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      disabled={already}
                      onClick={() => {
                        onPick(t);
                        close();
                      }}
                      className="flex w-full min-w-0 items-center gap-2 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{t.nameKo}</span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {t.position} · {t.nameEn}
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
                        {already ? "이미 있음" : "추가"}
                      </span>
                    </button>
                  </li>
                );
              })}
              {list.length === 0 && (
                <li className="px-2 py-1 text-[13px] font-medium text-muted-foreground">목록에서 찾지 못했어요.</li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onCustom(text);
                    close();
                  }}
                  className="flex w-full items-center gap-1.5 rounded-xl px-2 py-2.5 text-left text-[14px] text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Plus className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">‘{text}’ 이름으로 직접 추가 (확인 후 기술 카드가 돼요)</span>
                </button>
              </li>
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
