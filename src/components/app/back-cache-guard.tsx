"use client";

import { useEffect } from "react";

// 브라우저가 '뒤로 가기' 때 메모리에 둔 화면을 서버에 묻지 않고 그대로 보여 주는 경우(back-forward cache)
// 다시 불러온다 → 로그아웃했다면 로그인 검사(proxy)가 로그인 화면으로 보낸다(T-34). 앱 안 이동에는 영향 없음.
export function BackCacheGuard() {
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return null;
}
