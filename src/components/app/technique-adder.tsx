"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchTechniques } from "@/app/app/log/actions";
import type { MatchedTechnique } from "@/lib/mock/log-seed";

// 정리 화면 "기술 추가" (D-31) — 우리 목록에서 이름 · 영어 이름 · 다른 이름으로 찾아 고르면 기술 카드로,
// 없으면 이름만 직접 추가(카드 없음). 두 글자부터 찾는다.
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

  const text = query.trim();
  const ready = text.replace(/\s/g, "").length >= 2;
  const loading = ready && results.q !== text;

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted"
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden />
        기술 추가
      </button>
    );
  }

  const list = ready && results.q === text ? results.list : [];

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 40))}
            placeholder="기술 이름으로 찾기 (예: 시저, 오소토)"
            aria-label="기술 이름으로 찾기"
            className="h-11 w-full rounded-xl border border-input bg-background pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button variant="ghost" size="icon" aria-label="기술 추가 닫기" className="rounded-full" onClick={close}>
          <X />
        </Button>
      </div>

      {!ready ? (
        <p className="px-1 text-[13px] font-medium text-muted-foreground">두 글자 이상 적어 주세요.</p>
      ) : loading ? (
        <p className="flex items-center gap-1.5 px-1 text-[13px] font-medium text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          찾는 중…
        </p>
      ) : (
        <ul className="flex flex-col">
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
              <span className="min-w-0 truncate">‘{text}’ 이름으로 직접 추가 (복습 카드 없음)</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
