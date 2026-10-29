"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/lib/supabase/client";

// 로그인 버튼 (D-05 → D-66): 카카오 · 네이버 · Google. 로그인 뒤 /auth/callback → next 로 돌아간다.
// Supabase 대시보드에서 설정을 끝낸 로그인만 true — 설정 전 버튼이 오류를 내지 않게.
const READY = { kakao: true, naver: true, google: true }; // 네이버: D-69 로 숨겼다가 다시 켬(D-70)

type Way = {
  key: keyof typeof READY;
  provider: "kakao" | "google" | `custom:${string}`;
  label: string;
  name: string;
  className: string;
  mark: React.ReactNode;
};

const WAYS: Way[] = [
  {
    key: "kakao",
    provider: "kakao",
    label: "카카오로 계속하기",
    name: "카카오",
    // 카카오 로그인 디자인 가이드: 노란 바탕 · 검은 말풍선 · 85% 검정 글자
    className: "border-0 bg-[#FEE500] text-black/85 hover:bg-[#FEE500]/90",
    mark: <KakaoMark />,
  },
  {
    key: "naver",
    provider: "custom:naver", // Supabase 직접 추가 로그인(D-66)
    label: "네이버로 계속하기",
    name: "네이버",
    className: "border-0 bg-[#03C75A] text-white hover:bg-[#03C75A]/90",
    mark: <NaverMark />,
  },
  {
    key: "google",
    provider: "google",
    label: "Google 로 계속하기",
    name: "Google",
    className: "bg-card",
    mark: <GoogleMark />,
  },
];

export function LoginButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";

  async function signIn(way: Way) {
    setLoading(way.key);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: way.provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setLoading(null);
      toast.error("로그인을 시작하지 못했어요. 잠시 뒤 다시 눌러 주세요.");
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {WAYS.filter((w) => READY[w.key]).map((w) => (
        <Button
          key={w.key}
          variant="outline"
          onClick={() => signIn(w)}
          disabled={loading !== null}
          className={`h-12 w-full rounded-full text-base ${w.className}`}
        >
          {w.mark}
          {loading === w.key ? `${w.name}(으)로 이동 중…` : w.label}
        </Button>
      ))}
    </div>
  );
}

// 카카오 말풍선 심볼
function KakaoMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#000"
        d="M12 3.6c-4.97 0-9 3.14-9 7.02 0 2.5 1.67 4.69 4.19 5.93l-.86 3.13c-.08.28.24.5.48.34l3.7-2.45c.49.06.98.09 1.49.09 4.97 0 9-3.14 9-7.04S16.97 3.6 12 3.6z"
      />
    </svg>
  );
}

// 네이버 'N'
function NaverMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#fff" d="M15.56 12.84 8.2 2.4H2.4v19.2h6.04V11.16l7.36 10.44h5.8V2.4h-6.04z" />
    </svg>
  );
}

// Google 'G' 마크 (브랜드 가이드 색)
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
