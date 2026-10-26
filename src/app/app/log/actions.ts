"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { matchLog } from "@/lib/matching";
import type { OrganizeResult } from "@/lib/matching/types";
import { MAX_BODY } from "@/lib/log-limits";

// "정리하기" — 글에서 기술 · 용어를 찾는다(T-06). 저장은 하지 않는다(저장은 T-08).
export async function organizeLog(body: string): Promise<OrganizeResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "로그인이 풀렸어요. 다시 로그인해 주세요." };

  const text = typeof body === "string" ? body.trim() : "";
  if (!text) return { ok: false, message: "글을 먼저 적어 주세요." };
  if (text.length > MAX_BODY) return { ok: false, message: `글은 ${MAX_BODY}자까지 정리할 수 있어요.` };

  try {
    return await matchLog(text);
  } catch (e) {
    // 원인(오류 종류)만 서버 로그에 남긴다. 글 내용 · 키는 남기지 않는다.
    console.error("organizeLog failed:", e instanceof Error ? e.name + " " + e.message.slice(0, 120) : "unknown");
    return { ok: false, message: "정리하지 못했어요. 잠시 뒤 다시 눌러 주세요." };
  }
}
