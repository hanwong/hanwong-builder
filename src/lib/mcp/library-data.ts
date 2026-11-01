import { createClient } from "@supabase/supabase-js";

// 공용 기술 목록 · 포지션 노트 · 개념 카드 · 기본 드릴 읽기(D-81 · D-83 · D-112). "server-only" 를 붙이지 않는다 —
// 위키 내보내기 스크립트(D-114)도 같은 코드로 읽는다. 사용자 기록 · 숙련도 · 내가 만든 기술은 읽지 않는다.

export type Position = {
  slug: string;
  nameKo: string;
  nameEn: string;
  sort: number;
  summary: string;
  variants: string[];
};
export type PositionNote = {
  position: string;
  role: "top" | "bottom" | "standing";
  goals: string[];
  keys: string[];
  decisions: string[];
  mistakes: string[];
  drills: string[];
};
export type Concept = {
  slug: string;
  nameKo: string;
  nameEn: string;
  kind: "principle" | "learning";
  summary: string;
  body: string[];
  examples: string[];
  relatedPositions: string[];
  relatedTechniques: string[];
  seeAlso: string[];
};
export type Technique = {
  slug: string;
  position: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  steps: string[];
  kind: string | null;
  role: string | null;
  endsAt: string[];
  keyPoints: string[];
  mistakes: string[];
  ifBlocked: string[];
  defense: string[];
  rules: string[];
};
export type Drill = {
  slug: string;
  nameKo: string;
  nameEn: string;
  aliases: string[];
  summary: string;
  steps: string[];
  tips: string[];
  why: string[];
  related: string[]; // 이어지는 기술 slug — 적어 둔 순서대로
};
export type LibraryData = {
  positions: Position[];
  techniques: Technique[];
  notes: PositionNote[];
  concepts: Concept[];
  drills: Drill[];
};
export type Library = LibraryData & {
  posBySlug: Map<string, Position>;
  bySlug: Map<string, Technique>;
  conceptBySlug: Map<string, Concept>;
};

/** 로그인 없는(anon) 연결 — 공용 목록만 읽힌다(사용자 표는 접근 규칙으로 막힘). */
export function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function fetchLibraryData(supabase = anonClient()): Promise<LibraryData> {
  const [pos, tech, notes, cons, drills] = await Promise.all([
    supabase.from("positions").select("id, slug, name_ko, name_en, sort_order, summary, variants").order("sort_order"),
    supabase
      .from("techniques")
      .select(
        "slug, position_id, name_ko, name_en, aliases, steps, kind, role, ends_at, key_points, mistakes, if_blocked, defense, rules, sort_order",
      )
      .is("owner_id", null)
      .order("sort_order"),
    supabase.from("position_notes").select("position_id, role, goals, keys, decisions, mistakes, drills"),
    supabase
      .from("concepts")
      .select("slug, name_ko, name_en, kind, summary, body, examples, related_positions, related_techniques, see_also")
      .order("sort_order"),
    supabase
      .from("drills")
      .select("slug, name_ko, name_en, aliases, summary, steps, tips, why, related_techniques")
      .order("sort_order"),
  ]);
  if (pos.error || tech.error || notes.error || cons.error || drills.error) throw new Error("library");
  const posById = new Map(pos.data.map((p) => [p.id as string, p.slug as string]));
  const positions: Position[] = pos.data.map((p) => ({
    slug: p.slug,
    nameKo: p.name_ko,
    nameEn: p.name_en,
    sort: p.sort_order,
    summary: p.summary ?? "",
    variants: p.variants ?? [],
  }));
  const order = new Map(positions.map((p, i) => [p.slug, i]));
  const techniques: Technique[] = tech.data
    .map((t) => ({
      slug: t.slug,
      position: posById.get(t.position_id) ?? "",
      nameKo: t.name_ko,
      nameEn: t.name_en,
      aliases: t.aliases ?? [],
      steps: t.steps ?? [],
      kind: t.kind,
      role: t.role,
      endsAt: t.ends_at ?? [],
      keyPoints: t.key_points ?? [],
      mistakes: t.mistakes ?? [],
      ifBlocked: t.if_blocked ?? [],
      defense: t.defense ?? [],
      rules: t.rules ?? [],
    }))
    .sort((a, b) => (order.get(a.position) ?? 99) - (order.get(b.position) ?? 99));
  const concepts: Concept[] = cons.data.map((c) => ({
    slug: c.slug,
    nameKo: c.name_ko,
    nameEn: c.name_en,
    kind: c.kind,
    summary: c.summary,
    body: c.body ?? [],
    examples: c.examples ?? [],
    relatedPositions: c.related_positions ?? [],
    relatedTechniques: c.related_techniques ?? [],
    seeAlso: c.see_also ?? [],
  }));
  return {
    positions,
    techniques,
    notes: notes.data.map((n) => ({
      position: posById.get(n.position_id) ?? "",
      role: n.role,
      goals: n.goals ?? [],
      keys: n.keys ?? [],
      decisions: n.decisions ?? [],
      mistakes: n.mistakes ?? [],
      drills: n.drills ?? [],
    })),
    concepts,
    drills: drills.data.map((d) => ({
      slug: d.slug,
      nameKo: d.name_ko,
      nameEn: d.name_en,
      aliases: d.aliases ?? [],
      summary: d.summary,
      steps: d.steps ?? [],
      tips: d.tips ?? [],
      why: d.why ?? [],
      related: d.related_techniques ?? [],
    })),
  };
}

/** 이름으로 바로 찾는 표를 붙인다 — 캐시에는 배열(LibraryData)만 넣고 쓸 때 만든다. */
export function toLibrary(data: LibraryData): Library {
  return {
    ...data,
    posBySlug: new Map(data.positions.map((p) => [p.slug, p])),
    bySlug: new Map(data.techniques.map((t) => [t.slug, t])),
    conceptBySlug: new Map(data.concepts.map((c) => [c.slug, c])),
  };
}
