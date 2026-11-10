"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// 리리롤 선택 상자 (D-149 → D-151 → D-158) — 앱 안의 모든 선택 상자는 이것으로.
// 누르면 목록이 칸 위에 "떠서" 열린다 — 아래 요소를 밀어내지 않는다(D-158). 칸 아래 자리가 모자라면 위로 열리고,
// 높이는 지금 보이는 화면(키보드 위) 안의 넓은 쪽에 맞춘다.
// 팝업 안에서는 목록을 그 팝업 안에 붙인다 — 팝업 밖(body)에 붙이면 아이폰에서 팝업의 스크롤 막기에 걸려
// 목록이 스크롤되지 않고 깜빡였다(D-151 의 원인, Radix Select). 자리는 그리기 전에 재서 깜빡이지 않게.
// 값 ""(없음 · 고르기 전)도 쓸 수 있다. icon 은 목록 · 고른 칸에 같이 보인다(네트워크 로고, 수업 색 등).
type OptionSelectOption = {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

const GAP = 6 // 칸과 목록 사이
const EDGE = 8 // 화면 끝과 목록 사이
const MAX_H = 320

type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number; fixed: boolean }

function OptionSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "고르기",
  className,
  triggerClassName,
  disabled,
  "aria-label": ariaLabel,
}: {
  id?: string
  value: string
  onValueChange: (v: string) => void
  options: OptionSelectOption[]
  placeholder?: string
  className?: string // 바깥(칸) — 폭 · 배치
  triggerClassName?: string // 칸 자체 — 높이 · 글자
  disabled?: boolean
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [place, setPlace] = React.useState<Place | null>(null)
  const [host, setHost] = React.useState<HTMLElement | null>(null)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const listId = React.useId()
  const current = options.find((o) => o.value === value)

  // 목록 자리 — 칸 아래가 모자라고 위가 더 넓으면 위로. 높이는 그쪽 남은 자리까지(최대 320)
  const measure = React.useCallback(() => {
    const t = triggerRef.current
    const list = listRef.current
    if (!t || !list) return
    const r = t.getBoundingClientRect()
    const vv = window.visualViewport
    const viewTop = vv ? vv.offsetTop : 0
    const viewBottom = vv ? vv.offsetTop + vv.height : window.innerHeight
    const below = viewBottom - r.bottom - GAP - EDGE
    const above = r.top - viewTop - GAP - EDGE
    const natural = Math.min(list.scrollHeight, MAX_H)
    const down = below >= natural || below >= above
    const maxHeight = Math.max(120, Math.min(MAX_H, down ? below : above))
    const dialog = t.closest<HTMLElement>("[data-slot=dialog-content]")
    if (dialog) {
      // 팝업 안 — 팝업 기준 자리(팝업은 transform 이 있어 fixed 가 팝업 기준이 된다 → absolute 로 맞춘다)
      const d = dialog.getBoundingClientRect()
      setPlace({
        fixed: false,
        left: r.left - d.left,
        width: r.width,
        maxHeight,
        ...(down ? { top: r.bottom - d.top + GAP } : { bottom: d.bottom - r.top + GAP }),
      })
    } else {
      setPlace({
        fixed: true,
        left: r.left,
        width: r.width,
        maxHeight,
        ...(down ? { top: r.bottom + GAP } : { bottom: window.innerHeight - r.top + GAP }),
      })
    }
  }, [])

  // 열 때: 붙일 곳(팝업 안이면 그 팝업, 아니면 body)을 정하고 자리는 비운다 → 그리기 전에 다시 잰다
  function toggle() {
    if (!open) {
      setHost(triggerRef.current?.closest<HTMLElement>("[data-slot=dialog-content]") ?? document.body)
      setPlace(null)
    }
    setOpen((v) => !v)
  }
  React.useLayoutEffect(() => {
    if (open && host) measure()
  }, [open, host, measure, options.length])

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const n = e.target as Node
      if (!wrapRef.current?.contains(n) && !listRef.current?.contains(n)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        setOpen(false)
      }
    }
    // 뒤(페이지 · 팝업 본문)가 스크롤되거나 화면 크기가 바뀌면 칸을 따라간다. 목록 안 스크롤은 무시
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return
      measure()
    }
    const vv = window.visualViewport
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey, true)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", measure)
    vv?.addEventListener("resize", measure)
    vv?.addEventListener("scroll", measure)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey, true)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", measure)
      vv?.removeEventListener("resize", measure)
      vv?.removeEventListener("scroll", measure)
    }
  }, [open, measure])

  // 자리가 잡히면 고른 줄이 보이게(목록 안에서만 스크롤)
  React.useEffect(() => {
    const list = listRef.current
    const on = list?.querySelector<HTMLElement>("[aria-selected=true]")
    if (!list || !on || !place) return
    if (on.offsetTop < list.scrollTop || on.offsetTop + on.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = on.offsetTop - list.clientHeight / 2 + on.offsetHeight / 2
  }, [place])

  const list =
    open && host
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className="z-[60] overflow-y-auto overscroll-contain rounded-xl bg-card p-1 shadow-lg ring-1 ring-border"
            style={{
              position: place?.fixed === false ? "absolute" : "fixed",
              left: place?.left ?? 0,
              width: place?.width,
              top: place?.top,
              bottom: place?.bottom,
              maxHeight: place?.maxHeight ?? MAX_H,
              visibility: place ? "visible" : "hidden", // 자리 재기 전엔 숨김 — 깜빡임 없이
              pointerEvents: "auto",
            }}
          >
            {options.map((o) => {
              const on = o.value === value
              return (
                <li
                  key={o.value || "__none__"}
                  role="option"
                  aria-selected={on}
                  aria-disabled={o.disabled || undefined}
                  onClick={() => {
                    if (o.disabled) return
                    onValueChange(o.value)
                    setOpen(false)
                    triggerRef.current?.focus()
                  }}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-[15px] select-none hover:bg-muted active:bg-muted",
                    on && "bg-muted font-semibold",
                    o.disabled && "pointer-events-none opacity-40"
                  )}
                >
                  {o.icon}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {on && <CheckIcon className="size-4 shrink-0" aria-hidden />}
                </li>
              )
            })}
          </ul>,
          host
        )
      : null

  return (
    <div ref={wrapRef} className={cn("flex min-w-0 flex-col", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-input bg-card px-3 text-left text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-ring",
          triggerClassName
        )}
      >
        {current?.icon}
        <span className={cn("min-w-0 flex-1 truncate", !current && "text-muted-foreground")}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDownIcon
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {list}
    </div>
  )
}

export { OptionSelect, type OptionSelectOption }
