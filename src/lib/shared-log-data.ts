import "server-only";
import { createSupabaseServer } from "@/lib/supabase/server";

// 공유한 기록(D-123) — 올린 사람이 공유를 켠 기록을 다른 로그인한 사람이 볼 때. DB 함수 shared_log 가 날짜 · 기술 · 닉네임만 돌려준다.
export type SharedLog = {
  id: string;
  loggedOn: string;
  body: string; // 수업 메모(D-124) — 공유의 핵심이라 보여 준다
  nick: string | null; // 올린 사람 닉네임(공유를 켤 때 적게 하지만, 뒤에 지웠을 수 있다)
  owner: boolean; // 내가 올린 것(그러면 보통 고치기 화면이 먼저 나와 여기 안 온다)
  techniques: { slug: string; nameKo: string; nameEn: string; position: string; positionSlug: string | null; public: boolean }[];
  customNames: string[];
  importedId: string | null; // 내가 이미 가져온 기록 id
};

type Raw = {
  logged_on: string;
  body: string | null;
  nick: string | null;
  owner: boolean;
  techniques: { slug: string; name_ko: string; name_en: string; position: string | null; position_slug: string | null; public: boolean }[];
  custom_names: string[];
  imported_id: string | null;
};

export async function getSharedLog(id: string): Promise<SharedLog | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("shared_log", { p_id: id });
  if (error) throw new Error(`shared_log: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const raw = data as unknown as Raw;
  return {
    id,
    loggedOn: raw.logged_on,
    body: raw.body ?? "",
    nick: raw.nick ?? null,
    owner: !!raw.owner,
    techniques: (raw.techniques ?? []).map((t) => ({
      slug: t.slug,
      nameKo: t.name_ko,
      nameEn: t.name_en,
      position: t.position ?? "",
      positionSlug: t.position_slug,
      public: !!t.public,
    })),
    customNames: raw.custom_names ?? [],
    importedId: raw.imported_id ?? null,
  };
}
