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

// 목록 한 줄 = 적힌 이름 하나. 초안은 운영자가 누를 때 만든다(D-49)
export type AdminItem = {
  key: string; // name_key
  name: string;
  times: number;
  people: number;
  draft: AdminDraft | null;
};

// 사용자 보완 제안(D-50) — 누가 보냈는지는 담지 않는다
export type AdminSuggestion = {
  id: string;
  slug: string;
  nameKo: string;
  currentSteps: string[];
  currentAliases: string[];
  steps: string[]; // 제안한 세팅 과정
  addAliases: string[];
  reason: string;
};

export type AdminData = {
  items: AdminItem[]; // 제한 없이 전부, 많이 적힌 순
  suggestions: AdminSuggestion[]; // 오래된 것부터
  leftToday: number; // 오늘 더 만들 수 있는 초안 수
  live: boolean; // Claude 키가 있나
  positions: { slug: string; nameKo: string }[];
};

export const DRAFT_SELECT =
  "id, name_key, custom_name, kind, slug, name_ko, name_en, aliases, steps, note, positions(slug), alias:techniques!technique_drafts_alias_of_fkey(slug, name_ko)";

type DraftRow = {
  id: string;
  name_key: string;
  custom_name: string;
  kind: string;
  slug: string | null;
  name_ko: string | null;
  name_en: string | null;
  aliases: string[] | null;
  steps: string[] | null;
  note: string | null;
  positions: { slug: string } | null;
  alias: { slug: string; name_ko: string } | null;
};

export function toAdminDraft(d: DraftRow, times = 0, people = 0): AdminDraft {
  return {
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
    times,
    people,
  };
}

// 오늘(서울) 만든 초안 수 + 다시 추천 수 — 하루 20개 한도(D-47 · D-48)
export async function draftedToday(supabase: Supa): Promise<number> {
  const since = `${seoulToday()}T00:00:00+09:00`;
  const [made, redrafts] = await Promise.all([
    supabase.from("technique_drafts").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("ai_calls").select("id", { count: "exact", head: true }).eq("kind", "redraft").gte("called_at", since),
  ]);
  return (made.count ?? 0) + (redrafts.count ?? 0);
}

export async function isOperator(supabase: Supa): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_operator");
  return !error && data === true;
}

export async function getAdminData(): Promise<AdminData | null> {
  const supabase = await createSupabaseServer();
  if (!(await isOperator(supabase))) return null;

  const [drafts, pending, made, lib, suggestions] = await Promise.all([
    supabase.from("technique_drafts").select(DRAFT_SELECT).eq("status", "pending").order("created_at"),
    supabase.rpc("pending_custom_names"),
    draftedToday(supabase),
    getLibrary(supabase),
    supabase
      .from("technique_suggestions")
      .select("id, steps, add_aliases, reason, techniques(slug, name_ko, steps, aliases)")
      .eq("status", "pending")
      .order("created_at"),
  ]);
  if (drafts.error || pending.error || suggestions.error) throw new Error("admin read failed");

  const keys = drafts.data.map((d) => d.name_key);
  const { data: counts } = keys.length
    ? await supabase.rpc("custom_name_counts", { keys })
    : { data: [] as { name_key: string; times: number; people: number }[] };
  const count = new Map((counts ?? []).map((c) => [c.name_key, c]));

  const items: AdminItem[] = [
    ...drafts.data.map((d) => {
      const c = count.get(d.name_key);
      const draft = toAdminDraft(d as DraftRow, Number(c?.times ?? 0), Number(c?.people ?? 0));
      return { key: d.name_key, name: d.custom_name, times: draft.times, people: draft.people, draft };
    }),
    ...pending.data.map((p) => ({
      key: p.name_key,
      name: p.custom_name,
      times: Number(p.times),
      people: Number(p.people),
      draft: null,
    })),
  ].sort((a, b) => b.times - a.times || b.people - a.people);

  return {
    items,
    suggestions: suggestions.data
      .filter((x) => x.techniques)
      .map((x) => ({
        id: x.id,
        slug: x.techniques!.slug,
        nameKo: x.techniques!.name_ko,
        currentSteps: x.techniques!.steps,
        currentAliases: x.techniques!.aliases ?? [],
        steps: x.steps,
        addAliases: x.add_aliases ?? [],
        reason: x.reason ?? "",
      })),
    leftToday: Math.max(0, DAILY_DRAFT_LIMIT - made),
    live: isLive(),
    positions: lib.positions,
  };
}

// 홈 알림 줄: 운영자에게만 "목록 추가 대기 N개" (초안 대기 + 초안 전 이름 + 보완 제안, D-50)
export async function waitingCount(supabase: Supa): Promise<number | null> {
  if (!(await isOperator(supabase))) return null;
  const [drafts, pending, suggestions] = await Promise.all([
    supabase.from("technique_drafts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.rpc("pending_custom_names"),
    supabase.from("technique_suggestions").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return (drafts.count ?? 0) + (pending.data?.length ?? 0) + (suggestions.count ?? 0);
}
