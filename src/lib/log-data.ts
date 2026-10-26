import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Level, MatchedTechnique, Term } from "@/lib/mock/log-seed";

// 저장한 기록 하나를 정리 완료 화면(상태 C) 모양으로 읽는다 (D-25). RLS 로 본인 기록만 나온다.
export type SavedLog = {
  id: string;
  loggedOn: string;
  body: string;
  terms: Term[];
  aiStatus: "ok" | "mock" | "none";
  techniques: MatchedTechnique[];
  customNames: string[];
};

export async function getLog(id: string): Promise<SavedLog | null> {
  "use cache: private"; // 내 데이터 — 서버에 남기지 않고, 휴대폰 안에서만 30초 재사용 → 미리 불러오기(prefetch)에 들어감
  cacheLife({ stale: 30 });
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("class_logs")
    .select(
      "id, logged_on, body, terms, ai_status, class_log_techniques(created_at, custom_name, technique_id, techniques(slug, name_ko, name_en, steps, is_reviewed, positions(name_ko)))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`log: ${error.code ?? ""} ${error.message.slice(0, 80)}`);
  if (!data) return null;

  const linked = [...data.class_log_techniques].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const ids = linked.map((l) => l.technique_id).filter((x): x is string => !!x);
  const { data: levels } = ids.length
    ? await supabase.from("technique_levels").select("technique_id, level").in("technique_id", ids)
    : { data: [] };
  const levelOf = new Map((levels ?? []).map((l) => [l.technique_id, l.level as Level]));

  const techniques: MatchedTechnique[] = linked.flatMap((l) => {
    const t = l.techniques;
    if (!t || !l.technique_id) return [];
    return [
      {
        id: t.slug,
        nameKo: t.name_ko,
        nameEn: t.name_en,
        position: t.positions?.name_ko ?? "",
        steps: t.steps,
        level: levelOf.get(l.technique_id) ?? "beginner",
        draft: !t.is_reviewed,
      },
    ];
  });

  const status = data.ai_status === "ok" || data.ai_status === "mock" ? data.ai_status : "none";
  return {
    id: data.id,
    loggedOn: data.logged_on,
    body: data.body,
    terms: Array.isArray(data.terms) ? (data.terms as Term[]) : [],
    aiStatus: status,
    techniques,
    customNames: linked.map((l) => l.custom_name).filter((n): n is string => !!n),
  };
}
