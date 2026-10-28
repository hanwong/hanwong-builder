"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isLive } from "@/lib/matching";
import { forgetLibrary, getLibrary } from "@/lib/matching/library";
import { DAILY_DRAFT_LIMIT, draftNames, nameKey, type Draft, type DraftKind } from "@/lib/admin/drafter";
import { addDays, seoulToday } from "@/lib/seoul-date";
import { DRAFT_SELECT, draftedToday, toAdminDraft, type AdminDraft } from "@/lib/admin/admin-data";

// 운영 화면 (D-47 · D-49, T-39). 모든 동작은 운영자인지 DB 로 먼저 확인한다 — 표 · 함수도 운영자만 통과(RLS).

type Supa = Awaited<ReturnType<typeof createSupabaseServer>>;
export type AdminResult = { ok: true; message?: string } | { ok: false; message: string };

async function operator(): Promise<Supa | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("is_operator");
  return !error && data === true ? supabase : null;
}

// 목록에서 이름을 누르면 그 이름 하나만 초안을 만든다(D-49). 이미 있으면 그 초안을 돌려준다(비용 0).
export type DraftNameResult = { ok: true; draft: AdminDraft } | { ok: false; message: string };

export async function draftName(key: string): Promise<DraftNameResult> {
  const supabase = await operator();
  if (!supabase) return { ok: false, message: "운영자만 쓸 수 있어요." };
  if (typeof key !== "string" || !key || key.length > 100) return { ok: false, message: "잘못된 요청이에요." };

  const existing = async () => {
    const { data } = await supabase
      .from("technique_drafts")
      .select(DRAFT_SELECT)
      .eq("name_key", key)
      .eq("status", "pending")
      .maybeSingle();
    return data;
  };

  // 적힌 이름인지 · 몇 번 · 몇 명인지는 DB 에서 다시 확인한다(화면에서 온 값을 믿지 않음)
  const { data: pending, error } = await supabase.rpc("pending_custom_names");
  if (error) return { ok: false, message: "적힌 이름을 읽지 못했어요." };
  const item = (pending ?? []).find((p) => p.name_key === key);
  if (!item) {
    const row = await existing();
    if (row) return { ok: true, draft: toAdminDraft(row) };
    return { ok: false, message: "이미 처리됐거나 없는 이름이에요." };
  }

  if (!isLive()) return { ok: false, message: "Claude 키가 없어 초안을 만들 수 없어요(연습용 예시)." };
  if ((await draftedToday(supabase)) >= DAILY_DRAFT_LIMIT)
    return { ok: false, message: `오늘 초안 ${DAILY_DRAFT_LIMIT}개를 다 만들었어요 — 내일 다시 눌러 주세요.` };

  const lib = await getLibrary(supabase);
  let d: Draft;
  try {
    [d] = await draftNames([item.custom_name], lib);
  } catch (e) {
    console.error("draftName failed:", e instanceof Error ? e.name + " " + e.message.slice(0, 120) : "unknown");
    return { ok: false, message: "초안을 만들지 못했어요 — 잠시 뒤 다시 눌러 주세요." };
  }

  const [pos, tech] = await Promise.all([
    d.position ? supabase.from("positions").select("id").eq("slug", d.position).maybeSingle() : null,
    d.aliasOf ? supabase.from("techniques").select("id").eq("slug", d.aliasOf).maybeSingle() : null,
  ]);
  const { data: row, error: insertError } = await supabase
    .from("technique_drafts")
    .insert({
      name_key: nameKey(item.custom_name),
      custom_name: item.custom_name.slice(0, 100),
      kind: d.kind,
      alias_of: tech?.data?.id ?? null,
      position_id: pos?.data?.id ?? null,
      slug: d.slug,
      name_ko: d.nameKo || null,
      name_en: d.nameEn || null,
      aliases: d.aliases,
      steps: d.steps,
      note: d.note || null,
    })
    .select(DRAFT_SELECT)
    .single();
  if (insertError) {
    // 두 화면에서 같은 이름을 동시에 눌렀으면 먼저 만든 초안을 쓴다
    const other = insertError.code === "23505" ? await existing() : null;
    if (other) return { ok: true, draft: toAdminDraft(other, Number(item.times), Number(item.people)) };
    console.error("draft insert failed:", insertError.code ?? "", (insertError.message ?? "").slice(0, 120));
    return { ok: false, message: "초안을 저장하지 못했어요." };
  }
  return { ok: true, draft: toAdminDraft(row, Number(item.times), Number(item.people)) };
}

// 다시 추천 (D-48) — 카드 하나를 이전 초안 + 운영자 메모와 함께 다시 만든다. 하루 한도 1개로 센다.
export type RedraftResult =
  | { ok: true; draft: Omit<AdminDraft, "id" | "name" | "times" | "people"> }
  | { ok: false; message: string };

export async function redraftDraft(id: string, hint: string, current: DraftEdit): Promise<RedraftResult> {
  const supabase = await operator();
  if (!supabase) return { ok: false, message: "운영자만 쓸 수 있어요." };
  if (!isLive()) return { ok: false, message: "Claude 키가 없어 다시 추천할 수 없어요." };
  if ((await draftedToday(supabase)) >= DAILY_DRAFT_LIMIT)
    return { ok: false, message: `오늘 초안 ${DAILY_DRAFT_LIMIT}개를 다 써서 내일 다시 추천할 수 있어요.` };

  const { data: row } = await supabase
    .from("technique_drafts")
    .select("custom_name")
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle();
  if (!row) return { ok: false, message: "이미 처리된 초안이에요." };

  // 이전 초안 = 운영자가 지금 화면에서 보고 있는 칸(고친 것 포함)
  const previous: Omit<Draft, "name"> = {
    kind: current?.kind === "alias" || current?.kind === "new" ? current.kind : "unclear",
    aliasOf: clean(current?.aliasOf, 80) || null,
    position: clean(current?.position, 40) || null,
    slug: clean(current?.slug, 60) || null,
    nameKo: clean(current?.nameKo, 60),
    nameEn: clean(current?.nameEn, 80),
    aliases: [],
    steps: (Array.isArray(current?.steps) ? current.steps : []).map((x) => clean(x, 120)).filter(Boolean).slice(0, 5),
    note: "",
  };

  const lib = await getLibrary(supabase);
  let d: Draft;
  try {
    [d] = await draftNames([row.custom_name], lib, { previous, hint: clean(hint, 200) });
  } catch (e) {
    console.error("redraft failed:", e instanceof Error ? e.name + " " + e.message.slice(0, 120) : "unknown");
    return { ok: false, message: "다시 추천하지 못했어요 — 잠시 뒤 다시 눌러 주세요." };
  }
  // 성공한 호출만 센다(정리하기와 같은 규칙)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase.from("ai_calls").insert({ user_id: user.id, kind: "redraft" });
    if (error) console.error("ai_calls redraft insert failed:", error.code ?? "", (error.message ?? "").slice(0, 80));
  }

  const [pos, tech] = await Promise.all([
    d.position ? supabase.from("positions").select("id").eq("slug", d.position).maybeSingle() : null,
    d.aliasOf ? supabase.from("techniques").select("id, name_ko").eq("slug", d.aliasOf).maybeSingle() : null,
  ]);
  const { error } = await supabase
    .from("technique_drafts")
    .update({
      kind: d.kind,
      alias_of: tech?.data?.id ?? null,
      position_id: pos?.data?.id ?? null,
      slug: d.slug,
      name_ko: d.nameKo || null,
      name_en: d.nameEn || null,
      aliases: d.aliases,
      steps: d.steps,
      note: d.note || null,
    })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return { ok: false, message: "새 초안을 저장하지 못했어요." };

  revalidatePath("/app/admin");
  return {
    ok: true,
    draft: {
      kind: d.kind,
      aliasOf: d.aliasOf && tech?.data ? { slug: d.aliasOf, nameKo: tech.data.name_ko } : null,
      position: d.position,
      slug: d.slug ?? "",
      nameKo: d.nameKo,
      nameEn: d.nameEn,
      aliases: d.aliases,
      steps: d.steps,
      note: d.note,
    },
  };
}

export type DraftEdit = {
  kind: DraftKind;
  aliasOf: string | null; // slug
  position: string | null; // slug
  slug: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  steps: string[];
};

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");

// 운영자가 고친 칸 → 초안에 저장 (대기 중인 것만)
async function saveEdit(supabase: Supa, id: string, e: DraftEdit): Promise<string | null> {
  const kind: DraftKind = e.kind === "alias" || e.kind === "new" ? e.kind : "unclear";
  const steps = (Array.isArray(e.steps) ? e.steps : []).map((s) => clean(s, 120)).filter(Boolean).slice(0, 5);
  const aliases = [...new Set((Array.isArray(e.aliases) ? e.aliases : []).map((s) => clean(s, 40)).filter(Boolean))].slice(0, 8);
  const slug = clean(e.slug, 60).toLowerCase();

  let aliasId: string | null = null;
  if (kind === "alias") {
    const { data } = await supabase.from("techniques").select("id").eq("slug", clean(e.aliasOf, 80)).maybeSingle();
    if (!data) return "다른 이름으로 붙일 기술을 골라 주세요.";
    aliasId = data.id;
  }
  let positionId: string | null = null;
  if (e.position) {
    const { data } = await supabase.from("positions").select("id").eq("slug", clean(e.position, 40)).maybeSingle();
    positionId = data?.id ?? null;
  }
  if (kind === "new") {
    if (!positionId) return "포지션을 골라 주세요.";
    if (!SLUG.test(slug)) return "영문 키는 영어 소문자 · 숫자 · 하이픈만 써요(예: berimbolo).";
    if (!clean(e.nameKo, 60) || !clean(e.nameEn, 80)) return "한국어 · 영어 이름을 채워 주세요.";
    if (steps.length < 3) return "세팅 과정은 3~5줄이 필요해요.";
    const { data: dup } = await supabase.from("techniques").select("id").eq("slug", slug).maybeSingle();
    if (dup) return "같은 영문 키의 기술이 이미 있어요 — 키를 바꾸거나 '다른 이름'으로 붙여 주세요.";
  }

  const { data, error } = await supabase
    .from("technique_drafts")
    .update({
      kind,
      alias_of: aliasId,
      position_id: positionId,
      slug: SLUG.test(slug) ? slug : null,
      name_ko: clean(e.nameKo, 60) || null,
      name_en: clean(e.nameEn, 80) || null,
      aliases,
      steps,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error || !data?.length) return "이미 처리됐거나 저장하지 못했어요.";
  return null;
}

export async function approveDraft(id: string, edit: DraftEdit): Promise<AdminResult> {
  const supabase = await operator();
  if (!supabase) return { ok: false, message: "운영자만 쓸 수 있어요." };
  if (edit?.kind === "unclear") return { ok: false, message: "'기술 아님 같음'은 승인할 수 없어요 — 종류를 바꾸거나 버려 주세요." };
  const problem = await saveEdit(supabase, id, edit);
  if (problem) return { ok: false, message: problem };

  const { data, error } = await supabase.rpc("approve_technique_draft", {
    p_draft: id,
    p_due: addDays(seoulToday(), 1), // 새 카드는 내일 복습(D-09)
  });
  if (error) {
    console.error("approve failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false, message: error.code === "23505" ? "같은 영문 키의 기술이 이미 있어요." : "승인하지 못했어요." };
  }
  forgetLibrary(); // 이 서버의 검색 · 정리하기는 바로, 다른 서버는 5분 안에
  revalidatePath("/app", "layout"); // 연결된 사람들의 홈 · 기록 · 내 기술 · 복습이 바뀐다
  const r = (data ?? {}) as { logs?: number; users?: number };
  return {
    ok: true,
    message: r.logs ? `${r.users}명의 기록 ${r.logs}건에 연결했어요.` : "목록에 넣었어요(연결할 기록 없음).",
  };
}

export async function rejectDraft(id: string): Promise<AdminResult> {
  const supabase = await operator();
  if (!supabase) return { ok: false, message: "운영자만 쓸 수 있어요." };
  const { data, error } = await supabase
    .from("technique_drafts")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error || !data?.length) return { ok: false, message: "이미 처리됐거나 저장하지 못했어요." };
  revalidatePath("/app/admin");
  revalidatePath("/app");
  return { ok: true, message: "버렸어요. 그 이름은 직접 적은 이름으로 남아요." };
}

// 보완 제안 (D-50) — 운영자가 최종으로 고친 세팅 과정 · 더할 다른 이름으로 승인하거나 버린다
export async function approveSuggestion(id: string, steps: string[], aliases: string[]): Promise<AdminResult> {
  const supabase = await operator();
  if (!supabase) return { ok: false, message: "운영자만 쓸 수 있어요." };
  const lines = (Array.isArray(steps) ? steps : []).map((x) => clean(x, 120)).filter(Boolean);
  if (lines.length < 3 || lines.length > 5) return { ok: false, message: "세팅 과정은 3~5줄이 필요해요." };
  const add = [...new Set((Array.isArray(aliases) ? aliases : []).map((x) => clean(x, 40)).filter(Boolean))].slice(0, 5);

  const { data, error } = await supabase.rpc("approve_technique_suggestion", { p_id: id, p_steps: lines, p_aliases: add });
  if (error) {
    console.error("approveSuggestion failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false, message: "승인하지 못했어요 — 이미 처리됐을 수 있어요." };
  }
  forgetLibrary(); // 다른 이름이 바뀌면 검색 · 정리하기 목록도 바뀐다
  revalidatePath("/app", "layout"); // 기술 상세 · 복습 뒷면 · 보낸 사람 홈 알림
  const added = (data as { aliases_added?: number } | null)?.aliases_added ?? 0;
  return { ok: true, message: added ? `반영했어요(다른 이름 ${added}개 추가).` : "반영했어요." };
}

export async function rejectSuggestion(id: string): Promise<AdminResult> {
  const supabase = await operator();
  if (!supabase) return { ok: false, message: "운영자만 쓸 수 있어요." };
  const { data, error } = await supabase
    .from("technique_suggestions")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error || !data?.length) return { ok: false, message: "이미 처리됐거나 저장하지 못했어요." };
  revalidatePath("/app", "layout"); // 보낸 사람의 "확인 대기 중" 표시가 풀린다
  return { ok: true, message: "버렸어요." };
}

// 사용자가 만든 기술 (D-57) — 운영자가 고친 포지션 · 이름 · 세팅 과정으로 승인하면 공용 기술이 되고 만든 사람에게 알림.
// 버리면 만든 사람에게만 계속 보인다(기록 · 카드는 그대로).
export async function approveUserTechnique(
  id: string,
  edit: { position: string; nameKo: string; nameEn: string; steps: string[] },
): Promise<AdminResult> {
  const supabase = await operator();
  if (!supabase) return { ok: false, message: "운영자만 쓸 수 있어요." };
  const lines = (Array.isArray(edit?.steps) ? edit.steps : []).map((x) => clean(x, 120)).filter(Boolean);
  if (lines.length < 3 || lines.length > 5) return { ok: false, message: "세팅 과정은 3~5줄이 필요해요." };
  const nameKo = clean(edit?.nameKo, 60);
  const nameEn = clean(edit?.nameEn, 80);
  if (!nameKo || !nameEn) return { ok: false, message: "한국어 · 영어 이름을 채워 주세요." };
  if (!clean(edit?.position, 40)) return { ok: false, message: "포지션을 골라 주세요." };

  const { error } = await supabase.rpc("approve_user_technique", {
    p_id: id,
    p_position: clean(edit.position, 40),
    p_name_ko: nameKo,
    p_name_en: nameEn,
    p_steps: lines,
  });
  if (error) {
    console.error("approveUserTechnique failed:", error.code ?? "", (error.message ?? "").slice(0, 120));
    return { ok: false, message: "승인하지 못했어요 — 이미 처리됐을 수 있어요." };
  }
  forgetLibrary(); // 이 서버의 검색 목록은 바로, 다른 서버는 5분 안에
  revalidatePath("/app", "layout");
  return { ok: true, message: "승인했어요. 이제 모두의 기술 목록에 보여요." };
}

export async function rejectUserTechnique(id: string): Promise<AdminResult> {
  const supabase = await operator();
  if (!supabase) return { ok: false, message: "운영자만 쓸 수 있어요." };
  const { error } = await supabase.rpc("reject_user_technique", { p_id: id });
  if (error) return { ok: false, message: "이미 처리됐거나 저장하지 못했어요." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "버렸어요. 만든 사람에게만 계속 보여요." };
}
