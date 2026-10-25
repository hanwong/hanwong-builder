"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/lib/supabase/client";

// Google 로그인 버튼 하나 (D-05). 로그인 뒤 /auth/callback → next 로 돌아간다.
export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";

  async function signIn() {
    setLoading(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setLoading(false);
      toast.error("로그인을 시작하지 못했어요. 잠시 뒤 다시 눌러 주세요.");
    }
  }

  return (
    <Button
      variant="outline"
      onClick={signIn}
      disabled={loading}
      className="h-12 w-full rounded-full bg-card text-base"
    >
      <GoogleMark />
      {loading ? "Google 로 이동 중…" : "Google 로 계속하기"}
    </Button>
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
