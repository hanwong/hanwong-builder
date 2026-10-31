"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { loadPicker, PICKER_PICTURE, searchPicker, type PickerStore } from "@/lib/picker-store";
import { useFloatingDialog } from "@/lib/use-floating-dialog";
import type { MatchedTechnique } from "@/lib/mock/log-seed";

// 기술 고르기 (D-56) — 위 검색상자 · 아래 포지션 그림 칸. 그림을 누르면 그 포지션 기술 목록에서 여러 개 체크.
// 찾는 게 없으면 이름만 직접 추가 — 운영자 확인 후 기술 카드로 바뀐다(D-32).
// 떠 있는 팝업(T-35): 뒤 화면은 붙잡아 두고, 키보드 위 보이는 영역 안에 맞춘다.
type View = { kind: "grid" } | { kind: "position"; slug: string; nameKo: string };

export function TechniquePicker({
  selected,
  onToggle,
  onCustom,
}: {
  selected: string[]; // 고른 기술(slug)
  onToggle: (t: MatchedTechnique) => void; // 없으면 넣고 있으면 뺀다
  onCustom: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: "grid" });
  const [query, setQuery] = useState("");
  const [store, setStore] = useState<PickerStore | null>(null);
  const [failed, setFailed] = useState(false);
  const floating = useFloatingDialog(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const text = query.trim();
  const searching = text.replace(/\s/g, "").length >= 2;
  const count = selected.length;

  // 기록 화면이 열리면 바로 받아 둔다(이미 받았으면 그대로) — 팝업을 열 때 기다리지 않게 (D-56 속도)
  useEffect(() => {
    let alive = true;
    loadPicker()
      .then((s) => alive && setStore(s))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [open]);

  // 열 때마다 포지션 칸 · 빈 검색부터(닫을 때 바꾸면 닫히는 동안 화면이 바뀌어 보인다)
  function show() {
    setQuery("");
    setView({ kind: "grid" });
    setFailed(false);
    setOpen(true);
  }
  const close = () => setOpen(false);

  function showPosition(p: { slug: string; nameKo: string }) {
    setView({ kind: "position", slug: p.slug, nameKo: p.nameKo });
    scrollRef.current?.scrollTo(0, 0);
  }

  const slug = view.kind === "position" ? view.slug : null;
  const positions = store?.positions ?? null;
  const searchList = useMemo(() => (store && searching ? searchPicker(store, text) : []), [store, searching, text]);
  const positionList = slug && store ? (store.byPosition.get(slug) ?? []) : undefined;
  const loading = searching && !store;

  return (
    <>
      {count === 0 ? (
        // 아직 고른 기술이 없을 때 — 크게, 포지션 그림 몇 장을 보여 고르는 곳임을 알린다
        <button
          type="button"
          onClick={show}
          className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-6 transition-colors hover:bg-muted"
        >
          <span className="flex -space-x-3" aria-hidden>
            {["closed-guard", "mount", "back-control"].map((s) => (
              <Image
                key={s}
                src={`/positions/${s}.png`}
                alt=""
                width={56}
                height={56}
                className="rounded-xl bg-[#FAF9F4] ring-2 ring-card"
              />
            ))}
          </span>
          <span className="flex items-center gap-1.5 text-[17px] font-semibold">
            <Plus className="size-5" strokeWidth={2} aria-hidden />
            배운 기술 고르기
          </span>
          <span className="text-[13px] font-medium text-muted-foreground">포지션 그림이나 이름으로 찾아요</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={show}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          기술 더 고르기
        </button>
      )}

      <Dialog open={open} onOpenChange={(v) => (v ? show() : close())}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          style={{
            ...floating,
            height: floating.maxHeight,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "14px",
            overscrollBehavior: "contain",
          }}
        >
          <div className="flex items-center gap-1">
            {view.kind === "position" && !searching && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="포지션으로 돌아가기"
                className="-ml-2 rounded-full"
                onClick={() => setView({ kind: "grid" })}
              >
                <ArrowLeft className="size-5" strokeWidth={1.75} />
              </Button>
            )}
            <DialogTitle className="text-[17px] font-semibold">
              {view.kind === "position" && !searching ? view.nameKo : "배운 기술 고르기"}
            </DialogTitle>
            <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 ml-auto rounded-full" onClick={close}>
              <X />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            포지션 그림을 눌러 그 포지션 기술을 고르거나, 이름으로 찾아 고를 수 있어요.
          </DialogDescription>

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 40))}
              placeholder="이름으로 찾기 (예: 시저, 오소토)"
              aria-label="기술 이름으로 찾기"
              className="h-11 w-full rounded-xl border border-input bg-background pr-9 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {query && (
              <button
                type="button"
                aria-label="찾기 지우기"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div
            ref={scrollRef}
            className="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1"
            // 목록에 손대면 키보드를 먼저 내린다 → 아이폰이 화면을 밀어 올리지 않아 스크롤이 자연스럽다
            onTouchStart={() => {
              if (document.activeElement === inputRef.current) inputRef.current?.blur();
            }}
          >
            {failed ? (
              <p className="px-1 py-2 text-[13px] font-medium text-destructive">
                불러오지 못했어요. 닫고 다시 열어 주세요.
              </p>
            ) : searching ? (
              loading ? (
                <p className="flex items-center gap-1.5 px-1 py-2 text-[13px] font-medium text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  찾는 중…
                </p>
              ) : (
                <ul className="flex flex-col">
                  {searchList.map((t) => (
                    <TechniqueRow key={t.id} t={t} sub={`${t.position} · ${t.nameEn}`} on={selected.includes(t.id)} onToggle={onToggle} />
                  ))}
                  {searchList.length === 0 && (
                    <li className="px-2 py-1 text-[13px] font-medium text-muted-foreground">목록에서 찾지 못했어요.</li>
                  )}
                  <li className="px-2 pt-2">
                    {/* 목록에 없을 때 직접 추가 — 눈에 띄는 버튼으로(본인 요청 2026-10-31) */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onCustom(text);
                        close(); // 이름을 넣으면 팝업을 닫고 기록 화면의 카드로 돌아간다
                      }}
                      className="h-11 w-full justify-start gap-1.5 rounded-xl text-[15px] font-semibold"
                    >
                      <Plus className="size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 truncate">‘{text}’ 직접 추가</span>
                    </Button>
                    <p className="mt-1 px-1 text-[12px] font-medium text-muted-foreground">저장하면 내 기술에 추가되고, 관리자가 확인 후 기술 카드가 돼요.</p>
                  </li>
                </ul>
              )
            ) : view.kind === "grid" ? (
              positions ? (
                <ul className="grid grid-cols-3 gap-2">
                  {positions.map((p) => (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => showPosition(p)}
                        className="flex w-full flex-col items-center gap-1 rounded-xl p-1 text-center transition-colors hover:bg-muted"
                      >
                        <Image
                          src={`/positions/${p.slug}.png`}
                          alt=""
                          width={PICKER_PICTURE}
                          height={PICKER_PICTURE}
                          className="aspect-square h-auto w-full rounded-xl bg-[#FAF9F4] ring-1 ring-border"
                        />
                        <span className="line-clamp-2 text-[12px] leading-tight font-medium break-keep">{p.nameKo}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid grid-cols-3 gap-2" aria-busy="true">
                  {Array.from({ length: 9 }, (_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-xl" />
                  ))}
                </div>
              )
            ) : positionList ? (
              <ul className="flex flex-col">
                {positionList.map((t) => (
                  <TechniqueRow key={t.id} t={t} sub={t.nameEn} on={selected.includes(t.id)} onToggle={onToggle} />
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-1.5 px-1 py-2 text-[13px] font-medium text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                불러오는 중…
              </p>
            )}
          </div>

          <Button className="h-12 w-full shrink-0 rounded-full text-base shadow-none" onClick={close}>
            {count > 0 ? `다 골랐어요 (${count}개)` : "닫기"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TechniqueRow({
  t,
  sub,
  on,
  onToggle,
}: {
  t: MatchedTechnique;
  sub: string;
  on: boolean;
  onToggle: (t: MatchedTechnique) => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onToggle(t)}
        className="flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{t.nameKo}</span>
          <span className="block truncate text-[12px] text-muted-foreground">{sub}</span>
        </span>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full ring-1",
            on ? "bg-primary text-primary-foreground ring-primary" : "ring-border",
          )}
          aria-hidden
        >
          {on && <Check className="size-4" strokeWidth={2.5} />}
        </span>
      </button>
    </li>
  );
}
