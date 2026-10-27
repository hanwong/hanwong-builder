import "server-only";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isLive } from "@/lib/matching";
import { getLibrary } from "@/lib/matching/library";
import { DAILY_DRAFT_LIMIT, type DraftKind } from "@/lib/admin/drafter";
import { seoulToday } from "@/lib/seoul-date";

// 운영 화면(D-47) 데이터. 운영자가 아니면 null — 표 · 함수도 RLS 로 운영자만 통과한다.
type Supa = Awaited<ReturnType<typeof createSupabaseServer>>;

export type AdminDraft = {
  id: string;
  name: string; // 사용자가 적은 이름
  kind: DraftKind;
  aliasOf: { slug: string; nameKo: string } | null;
  position: string | null; // slug
  slug: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  steps: string[];
  note: string;
  times: number; // 몇 번 적혔나
  people: number; // 몇 명이
};

export type AdminData = {
  drafts: AdminDraft[];
  waiting: number; // 아직 초안이 없는 이름 수
  leftToday: number; // 오늘 더 만들 수 있는 초안 수
  live: boolean; // Claude 키가 있나
  positions: { slug: string; nameKo: string }[];
};

// 오늘(서울) 만든 초안 수 — 하루 20개 한도
export async function draftedToday(supabase: Supa): Promise<number> {
  const { count } = await supabase
    .from("technique_drafts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${seoulToday()}T00:00:00+09:00`);
  return count ?? 0;
}

export async function isOperator(supabase: Supa): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_operator");
  return !error && data === true;
}

export async function getAdminData(): Promise<AdminData | null> {
  const supabase = await createSupabaseServer();
  if (!(await isOperator(supabase))) return null;

  const [drafts, pending, made, lib] = await Promise.all([
    supabase
      .from("technique_drafts")
      .select(
        "id, name_key, custom_name, kind, slug, name_ko, name_en, aliases, steps, note, positions(slug), alias:techniques!technique_drafts_alias_of_fkey(slug, name_ko)",
      )
      .eq("status", "pending")
      .order("created_at"),
    supabase.rpc("pending_custom_names"),
    draftedToday(supabase),
    getLibrary(supabase),
  ]);
  if (drafts.error || pending.error) throw new Error("admin read failed");

  const keys = drafts.data.map((d) => d.name_key);
  const { data: counts } = keys.length
    ? await supabase.rpc("custom_name_counts", { keys })
    : { data: [] as { name_key: string; times: number; people: number }[] };
  const count = new Map((counts ?? []).map((c) => [c.name_key, c]));

  return {
    drafts: drafts.data.map((d) => ({
      id: d.id,
      name: d.custom_name,
      kind: d.kind as DraftKind,
      aliasOf: d.alias ? { slug: d.alias.slug, nameKo: d.alias.name_ko } : null,
      position: d.positions?.slug ?? null,
      slug: d.slug ?? "",
      nameKo: d.name_ko ?? "",
      nameEn: d.name_en ?? "",
      aliases: d.aliases ?? [],
      steps: d.steps ?? [],
      note: d.note ?? "",
      times: Number(count.get(d.name_key)?.times ?? 0),
      people: Number(count.get(d.name_key)?.people ?? 0),
    })),
    waiting: pending.data.length,
    leftToday: Math.max(0, DAILY_DRAFT_LIMIT - made),
    live: isLive(),
    positions: lib.positions,
  };
}

// 홈 알림 줄: 운영자에게만 "목록 추가 대기 N개" (초안 대기 + 초안 전 이름)
export async function waitingCount(supabase: Supa): Promise<number | null> {
  if (!(await isOperator(supabase))) return null;
  const [drafts, pending] = await Promise.all([
    supabase.from("technique_drafts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.rpc("pending_custom_names"),
  ]);
  return (drafts.count ?? 0) + (pending.data?.length ?? 0);
}
