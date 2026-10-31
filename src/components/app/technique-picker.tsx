"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { loadPicker, PICKER_PICTURE, searchPicker, type PickerStore } from "@/lib/picker-store";
import { POSITION_PLAIN } from "@/lib/position-plain";
import { useFloatingDialog } from "@/lib/use-floating-dialog";
import type { MatchedTechnique } from "@/lib/mock/log-seed";

// 기술 고르기 (D-56) — 위 검색상자 · 아래 포지션 그림 칸. 그림을 누르면 그 포지션 기술 목록(종류 칩으로 좁히기, D-96)에서 여러 개 체크.
// 찾는 게 없으면 이름만 직접 추가 — 운영자 확인 후 기술 카드로 바뀐다(D-32).
// 떠 있는 팝업(T-35): 뒤 화면은 붙잡아 두고, 키보드 위 보이는 영역 안에 맞춘다.
// 이름을 몰라도 찾게(D-96 · D-97): 위치 칩(위 · 아래 · 서서) → 쉬운 설명이 붙은 포지션(어디서) → 종류 칩(무엇을).
// 칩 이름은 초보자 말로, 이 순서로.
type View = { kind: "grid" } | { kind: "position"; slug: string; nameKo: string };
const ROLE_CHIP: [string, string][] = [
  ["bottom", "아래(누워서)"],
  ["top", "위"],
  ["standing", "서서"],
];
// 그 위치에서 하는 기술인가 — 양쪽 기술 · 내가 만든 기술(위치 없음)은 어디서나
const fits = (t: { role: string | null }, role: string | null) =>
  !role || !t.role || t.role === role || t.role === "both";
// 위치를 고르면 포지션을 두 묶음으로 — 그 위치 기술이 더 많은 곳(내 자세) 먼저, 나머지(상대가 유리한 자세)는 아래에
const ROLE_GROUPS: Record<string, [string, string]> = {
  bottom: ["내가 다리로 상대를 막고 있었어요", "상대에게 눌려 있었어요"],
  top: ["내가 상대를 누르고 있었어요", "상대 다리(가드) 안에 있었어요"],
  standing: ["서 있었어요", "그 밖"],
};
const ROLE_MIN = 3; // 한 포지션에 그 위치 기술이 이만큼 있어야 그 위치에서 보인다(클린치 '위' 1개 같은 것 빼기)
const KIND_CHIP: [string, string][] = [
  ["submission", "조르기 · 꺾기"],
  ["sweep", "뒤집기(스윕)"],
  ["pass", "가드 넘기(패스)"],
  ["escape", "빠져나오기"],
  ["back_take", "백 잡기"],
  ["transition", "자세 옮기기"],
  ["control", "누르기"],
  ["defense", "막기"],
  ["takedown", "넘기기(테이크다운)"],
  ["guard_pull", "가드 풀링"],
];

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
  const [kind, setKind] = useState<string | null>(null); // 종류 칩 — null 이면 전체
  const [role, setRole] = useState<string | null>(null); // 위치 칩 — null 이면 전체
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
    setRole(null);
    setFailed(false);
    setOpen(true);
  }
  const close = () => setOpen(false);

  function showPosition(p: { slug: string; nameKo: string }) {
    setView({ kind: "position", slug: p.slug, nameKo: p.nameKo });
    setKind(null);
    scrollRef.current?.scrollTo(0, 0);
  }

  const slug = view.kind === "position" ? view.slug : null;
  // 포지션 묶음 — 위치를 안 골랐으면 한 묶음(제목 없음), 골랐으면 [내 자세, 상대가 유리한 자세]
  const groups = useMemo(() => {
    if (!store) return null;
    if (!role) return [{ title: "", list: store.positions }];
    const mine: typeof store.positions = [];
    const theirs: typeof store.positions = [];
    for (const p of store.positions) {
      const list = (store.byPosition.get(p.slug) ?? []).filter((t) => t.role);
      const here = list.filter((t) => fits(t, role)).length;
      if (here < ROLE_MIN) continue;
      (here * 2 >= list.length ? mine : theirs).push(p);
    }
    const [a, b] = ROLE_GROUPS[role];
    return [
      { title: a, list: mine },
      { title: b, list: theirs },
    ].filter((g) => g.list.length);
  }, [store, role]);
  const searchList = useMemo(() => (store && searching ? searchPicker(store, text) : []), [store, searching, text]);
  const positionAll = slug && store ? (store.byPosition.get(slug) ?? []).filter((t) => fits(t, role)) : undefined;
  const roleLabel = ROLE_CHIP.find(([r]) => r === role)?.[1];
  const kinds = positionAll ? KIND_CHIP.filter(([k]) => positionAll.some((t) => t.kind === k)) : [];
  const positionList = positionAll && kind ? positionAll.filter((t) => t.kind === kind) : positionAll;
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
          <span className="text-[13px] font-medium text-muted-foreground">이름을 몰라도 포지션 그림으로 찾아요</span>
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
              {view.kind === "position" && !searching
                ? `${view.nameKo}${roleLabel ? ` · ${roleLabel}` : ""}`
                : "배운 기술 고르기"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label="닫기"
              className="-mr-1 ml-auto rounded-full"
              onClick={close}
            >
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
                    <TechniqueRow
                      key={t.id}
                      t={t}
                      sub={`${t.position} · ${t.nameEn}`}
                      on={selected.includes(t.id)}
                      onToggle={onToggle}
                    />
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
                    <p className="mt-1 px-1 text-[12px] font-medium text-muted-foreground">
                      저장하면 내 기술에 추가되고, 관리자가 확인 후 기술 카드가 돼요.
                    </p>
                  </li>
                </ul>
              )
            ) : view.kind === "grid" ? (
              groups ? (
                <>
                  <p className="px-1 pb-2 text-[13px] font-medium text-muted-foreground break-keep">
                    이름을 몰라도 괜찮아요 — 어디였는지 고르고, 비슷한 그림을 누르세요.
                  </p>
                  <Chips
                    title="나는 어디였어요?"
                    label="내 위치"
                    items={ROLE_CHIP}
                    value={role}
                    onChange={(r) => {
                      setRole(r);
                      scrollRef.current?.scrollTo(0, 0);
                    }}
                  />
                  {groups.map((g) => (
                    <section key={g.title} className="pb-2">
                      {g.title && <h3 className="px-1 pt-1 pb-1 text-[13px] font-semibold">{g.title}</h3>}
                      <ul className="flex flex-col gap-1">
                        {g.list.map((p) => (
                          <li key={p.slug}>
                            <button
                              type="button"
                              onClick={() => showPosition(p)}
                              className="flex w-full min-w-0 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-muted"
                            >
                              <Image
                                src={`/positions/${p.slug}.png`}
                                alt=""
                                width={PICKER_PICTURE}
                                height={PICKER_PICTURE}
                                className="size-14 shrink-0 rounded-xl bg-[#FAF9F4] ring-1 ring-border"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15px] font-semibold">{p.nameKo}</span>
                                {POSITION_PLAIN[p.slug] && (
                                  <span className="line-clamp-2 text-[13px] leading-snug text-muted-foreground break-keep">
                                    {POSITION_PLAIN[p.slug]}
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </>
              ) : (
                <div className="flex flex-col gap-2" aria-busy="true">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              )
            ) : positionList ? (
              <>
                {kinds.length > 1 && (
                  <Chips
                    title="무엇을 했어요?"
                    label="기술 종류"
                    items={kinds}
                    value={kind}
                    onChange={(k) => {
                      setKind(k);
                      scrollRef.current?.scrollTo(0, 0);
                    }}
                  />
                )}
                <ul className="flex flex-col">
                  {positionList.map((t) => (
                    // 이름을 몰라도 알아보게 — 영어 이름 대신 세팅 과정 첫 줄(D-96)
                    <TechniqueRow
                      key={t.id}
                      t={t}
                      sub={t.steps[0] ?? t.nameEn}
                      on={selected.includes(t.id)}
                      onToggle={onToggle}
                    />
                  ))}
                </ul>
              </>
            ) : (
              <p className="flex items-center gap-1.5 px-1 py-2 text-[13px] font-medium text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                불러오는 중…
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            {/* 포지션 안에서는 엄지 닿는 아래에도 뒤로 가기(본인 요청 2026-10-31 "뒤로 가기가 맨위에 있어서 찾기 힘들어") */}
            {view.kind === "position" && !searching && (
              <Button
                variant="outline"
                className="h-12 shrink-0 gap-1 rounded-full px-4 text-base shadow-none"
                onClick={() => setView({ kind: "grid" })}
              >
                <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
                다른 포지션
              </Button>
            )}
            <Button className="h-12 min-w-0 flex-1 rounded-full text-base shadow-none" onClick={close}>
              {count > 0 ? `다 골랐어요 (${count}개)` : "닫기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// 고르기 칩 줄 — 맨 앞 '전체'(null) + 항목들. 고른 칩은 먹색으로 채운다(DESIGN 기술 고르기)
function Chips({
  title,
  label,
  items,
  value,
  onChange,
}: {
  title: string;
  label: string;
  items: [string, string][];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="pb-2">
      <p className="px-1 pb-1.5 text-[13px] font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {[[null, "전체"] as const, ...items].map(([k, text]) => (
          <button
            key={text}
            type="button"
            aria-pressed={value === k}
            onClick={() => onChange(k)}
            className={cn(
              "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors",
              value === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
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
