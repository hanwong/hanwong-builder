import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// 서버(서버 컴포넌트 · Route Handler · Server Action)에서 쓰는 Supabase 클라이언트.
// 로그인 쿠키를 읽고 쓴다. 공개 키(NEXT_PUBLIC_)만 쓰므로 RLS 가 그대로 적용된다.
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) cookieStore.set(name, value, options);
          } catch {
            // 서버 컴포넌트에서는 쿠키를 못 쓴다 — proxy.ts 가 세션을 갱신하므로 무시해도 된다.
          }
        },
      },
    },
  );
}
