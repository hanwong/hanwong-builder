"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// 리리롤 선택 상자 (D-149 → D-151) — 앱 안의 모든 선택 상자는 이것으로.
// 누르면 목록이 칸 바로 아래로 "펼쳐진다"(화면 위에 따로 뜨지 않음). 아이폰에서 떠 있는 목록(Radix Select)이
// 스크롤되지 않고 깜빡여서(2026-11-10 본인 확인) 바꿨다 — 목록이 페이지 · 팝업 안에 그대로 있어 손가락 스크롤이 그냥 된다.
// 값 ""(없음 · 고르기 전)도 쓸 수 있다. icon 은 목록 · 고른 칸에 같이 보인다(네트워크 로고, 수업 색 등).
type OptionSelectOption = {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

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
  className?: string // 바깥(칸 + 펼친 목록) — 폭 · 배치
  triggerClassName?: string // 칸 자체 — 높이 · 글자
  disabled?: boolean
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const listId = React.useId()
  const current = options.find((o) => o.value === value)

  // 바깥을 누르거나 Esc 면 닫힘
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey, true)
    // 고른 줄이 보이게
    listRef.current?.querySelector<HTMLElement>("[aria-selected=true]")?.scrollIntoView({ block: "nearest" })
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open])

  return (
    <div ref={wrapRef} className={cn("flex min-w-0 flex-col", className)}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
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
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="mt-1.5 max-h-64 overflow-y-auto overscroll-contain rounded-xl bg-card p-1 ring-1 ring-border"
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
        </ul>
      )}
    </div>
  )
}

export { OptionSelect, type OptionSelectOption }
