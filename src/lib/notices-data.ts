import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { waitingCount } from "@/lib/admin/admin-data";

// 홈 맨 위 알림 (D-47): 내 알림("○○ 이(가) 기술 목록에 추가됐어요") + 운영자에게만 "목록 추가 대기 N개".
export type HomeNotices = {
  notices: { id: string; message: string; slug: string | null }[];
  waiting: number | null; // 운영자가 아니면 null
};

export async function getHomeNotices(): Promise<HomeNotices> {
  "use cache: private"; // 내 것만 — 홈 데이터와 같은 5분(D-45)
  cacheLife({ stale: 300 });
  const supabase = await createSupabaseServer();
  const [notices, waiting] = await Promise.all([
    supabase
      .from("notices")
      .select("id, message, techniques(slug)")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    waitingCount(supabase),
  ]);
  return {
    notices: (notices.data ?? []).map((n) => ({ id: n.id, message: n.message, slug: n.techniques?.slug ?? null })),
    waiting,
  };
}
