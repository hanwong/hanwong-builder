"use client";

import { useEffect, useState } from "react";

// 휴대폰에서 떠 있는 팝업(T-35)에 쓰는 두 가지:
// ① 열려 있는 동안 뒤 화면 고정 — 아이폰 사파리는 overflow 를 막아도 손가락 스크롤이 뒤로 넘어가서,
//    페이지를 지금 위치 그대로 position: fixed 로 붙잡아 두었다가 닫을 때 같은 위치로 되돌린다.
// ② 지금 눈에 보이는 영역(키보드 위) — 팝업 높이 · 위치를 여기에 맞춘다.
export function useFloatingDialog(open: boolean) {
  const [visible, setVisible] = useState<{ top: number; height: number } | null>(null);

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

  // 보이는 영역 맨 위에서 조금 띄우고, 높이는 그 안으로(키보드가 올라와도 제목 · 입력 칸이 안 가림)
  const style = {
    top: visible ? `${visible.top + 12}px` : "max(1rem, 5dvh)",
    translate: "-50% 0", // 가운데 정렬은 유지하고 세로 가운데 이동만 끈다(위쪽에 띄움)
    maxHeight: visible ? `${Math.min(600, visible.height - 24)}px` : "min(75dvh, 600px)",
  } as const;
  return style;
}
