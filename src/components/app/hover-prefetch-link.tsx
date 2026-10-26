"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";

// 목록이 긴 곳(내 기술 534개)용 — 평소엔 공용 껍데기만 미리 받고(prefetch 기본값),
// 손가락 · 마우스가 닿는 순간 그 기술 내용까지 미리 받는다. 전부 미리 받으면 서버 호출이 534번이라 이렇게 나눈다.
export function HoverPrefetchLink(props: ComponentProps<typeof Link>) {
  const [active, setActive] = useState(false);
  return (
    <Link
      {...props}
      prefetch={active ? true : "auto"}
      onMouseEnter={(e) => {
        setActive(true);
        props.onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        setActive(true);
        props.onTouchStart?.(e);
      }}
    />
  );
}
