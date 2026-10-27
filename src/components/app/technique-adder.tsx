"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { searchTechniques } from "@/app/app/log/actions";
import type { MatchedTechnique } from "@/lib/mock/log-seed";

// 정리 화면 "기술 추가" (D-31) — 우리 목록에서 이름 · 영어 이름 · 다른 이름으로 찾아 고르면 기술 카드로,
// 없으면 이름만 직접 추가 — 운영자 확인 후 라이브러리에 넣고 카드로 바꾼다(D-32). 두 글자부터 찾는다.
// 팝업으로 연다(T-35). 휴대폰(폭 640 미만)에서는 화면 전체 시트 — 뒤 화면이 보이지도 움직이지도 않고,
// 결과를 스크롤하기 시작하면 키보드를 내려 목록이 끝까지 자연스럽게 움직이게 한다(아이폰 키보드 + 떠 있는 팝업 문제).
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
  const [phone, setPhone] = useState(false); // 폭 640 미만 → 전체 화면 시트
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
    if (!open) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setPhone(mq.matches);
    const raf = requestAnimationFrame(update);
    mq.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", update);
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
          style={
            phone
              ? {
                  // 휴대폰: 화면 전체(뒤 화면이 보이지 않게), 위쪽 노치 자리만큼 띄움
                  inset: 0,
                  translate: "none",
                  width: "100%",
                  maxWidth: "none",
                  height: "100%",
                  borderRadius: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  padding: "max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom))",
                  overscrollBehavior: "contain",
                }
              : {
                  top: "max(1rem, 5dvh)",
                  translate: "-50% 0", // 가운데 정렬은 유지하고 세로 가운데 이동만 끈다(위쪽에 띄움)
                  maxHeight: "min(75dvh, 600px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  padding: "14px",
                  overscrollBehavior: "contain",
                }
          }
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
              // 결과를 밀기 시작하면 키보드를 내린다 → 목록이 화면 끝까지, 스크롤이 자연스럽게
              onTouchMove={() => {
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
