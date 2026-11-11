import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// 로그아웃: 세션 쿠키를 지우고 랜딩으로.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  const res = NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
  // Clear-Site-Data: "cache" 는 뺐다(D-188) — 브라우저가 이 사이트 저장분을 통째로 지우느라 로그아웃이 몇 초씩
  // 멈추고, 랜딩 그림 · 글꼴 · 코드도 처음부터 다시 받았다. '뒤로 가기' 막기는 /app no-store(next.config)와
  // pageshow 다시 불러오기(BackCacheGuard)로 충분하다(D-41 ① · ③).
  res.headers.set("Cache-Control", "no-store");
  return res;
}
