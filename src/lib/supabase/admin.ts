import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// 서버 전용 비밀 키 클라이언트 — RLS 를 거치지 않는다. 로그인한 사람이 없는 밤 작업(매일 에이전트, D-102)에서만 쓴다.
// 키는 .env.local · Vercel 환경변수에만(SUPABASE_SECRET_KEY). 없으면 null.
export function createSupabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
