import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

// 로그아웃: 세션 쿠키를 지우고, 브라우저에 저장된 화면도 지운 뒤 랜딩으로.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  const res = NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
  // 브라우저에 저장된 이 사이트 화면을 지운다 → '뒤로 가기'로 로그인 화면이 다시 보이지 않게(T-34)
  res.headers.set("Clear-Site-Data", '"cache"');
  res.headers.set("Cache-Control", "no-store");
  return res;
}
