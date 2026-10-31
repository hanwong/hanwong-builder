import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { mapFields, nameKey, type Draft } from "@/lib/admin/drafter";

// 초안 하나를 technique_drafts(승인 대기)에 넣을 줄로 바꾼다 — 운영 초안(D-47)과 매일 에이전트(D-102)가 함께 쓴다.
export async function draftRow(supabase: SupabaseClient<Database>, customName: string, d: Draft) {
  const [pos, tech] = await Promise.all([
    d.position ? supabase.from("positions").select("id").eq("slug", d.position).maybeSingle() : null,
    d.aliasOf ? supabase.from("techniques").select("id").eq("slug", d.aliasOf).maybeSingle() : null,
  ]);
  return {
    name_key: nameKey(customName),
    custom_name: customName.slice(0, 100),
    kind: d.kind,
    alias_of: tech?.data?.id ?? null,
    position_id: pos?.data?.id ?? null,
    slug: d.slug,
    name_ko: d.nameKo || null,
    name_en: d.nameEn || null,
    aliases: d.aliases,
    steps: d.steps,
    note: d.note || null,
    tech_kind: d.techKind,
    ...mapFields(d),
  } satisfies Database["public"]["Tables"]["technique_drafts"]["Insert"];
}
