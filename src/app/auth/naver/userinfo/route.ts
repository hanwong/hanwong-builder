import { NextResponse, type NextRequest } from "next/server";

// 네이버 로그인 (D-66) — Supabase 의 직접 추가 로그인(custom:naver)이 '내 정보 주소'로 부르는 곳.
// 네이버는 내 정보를 { resultcode, response: { id, email } } 처럼 한 겹 안에 줘서 Supabase 가 바로 못 읽는다.
// Supabase 가 보낸 네이버 토큰으로 네이버에 그대로 물어보고, 아이디 · 이메일만 꺼내 돌려준다. 저장 · 기록 없음.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const res = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: auth },
    cache: "no-store",
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: "upstream" }, { status: 502 });

  const body = (await res.json().catch(() => null)) as {
    resultcode?: string;
    response?: { id?: string; email?: string };
  } | null;
  const id = body?.response?.id;
  if (!res.ok || body?.resultcode !== "00" || !id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = body.response?.email;
  return NextResponse.json(
    // 네이버 이메일은 네이버가 확인한 연락처라 확인됨으로 넘긴다 — 같은 이메일의 기존 계정과 합쳐진다
    email ? { sub: id, email, email_verified: true } : { sub: id },
    { headers: { "Cache-Control": "no-store" } },
  );
}
