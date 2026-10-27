import "server-only";
import { cacheLife } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { seoulToday } from "@/lib/seoul-date";

// 오늘 복습 (T-09) — 복습일이 오늘(서울) 이하인 내 카드. RLS 로 본인 것만.
export type DueCard = {
  id: string;
  step: number;
  nameKo: string;
  nameEn: string;
  position: string;
  steps: string[];
  draft: boolean;
  lastNote: { loggedOn: string; text: string } | null; // 그 기술이 나온 내 최근 기록 한 줄
};

export type ReviewData = { cards: DueCard[]; laterDue: string | null };

export async function getReviewData(): Promise<ReviewData> {
  "use cache: private"; // 내 데이터 — 서버에 남기지 않고 휴대폰 안에서만 재사용. stale 5분 이상이어야 미리 받기(prefetch)에 포함된다(D-45)
  cacheLife({ stale: 300 }); // 5분 — 이보다 짧으면 탭을 눌러야 그때 불러와서 로딩이 보인다
  const supabase = await createSupabaseServer();

  const today = seoulToday();
  const [due, later] = await Promise.all([
    supabase
      .from("review_cards")
      .select("id, interval_step, technique_id, techniques(name_ko, name_en, steps, is_reviewed, positions(name_ko))")
      .lte("due_on", today)
      .order("due_on")
      .order("created_at")
      .limit(50),
    supabase.from("review_cards").select("due_on").gt("due_on", today).order("due_on").limit(1),
  ]);
  const error = due.error ?? later.error;
  if (error) throw new Error(`review: ${error.code ?? ""} ${error.message.slice(0, 80)}`);

  // 기술별 내 최근 기록 한 줄
  const ids = (due.data ?? []).map((c) => c.technique_id);
  const notes = new Map<string, { loggedOn: string; text: string }>();
  if (ids.length) {
    const { data } = await supabase
      .from("class_log_techniques")
      .select("technique_id, class_logs(logged_on, body)")
      .in("technique_id", ids);
    for (const row of data ?? []) {
      const log = row.class_logs;
      if (!row.technique_id || !log) continue;
      const prev = notes.get(row.technique_id);
      if (!prev || log.logged_on > prev.loggedOn) {
        const line = log.body.split("\n")[0];
        notes.set(row.technique_id, { loggedOn: log.logged_on, text: line.length > 60 ? `${line.slice(0, 60)}…` : line });
      }
    }
  }

  return {
    laterDue: later.data?.[0]?.due_on ?? null,
    cards: (due.data ?? []).flatMap((c) => {
      const t = c.techniques;
      if (!t) return [];
      return [
        {
          id: c.id,
          step: c.interval_step,
          nameKo: t.name_ko,
          nameEn: t.name_en,
          position: t.positions?.name_ko ?? "",
          steps: t.steps,
          draft: !t.is_reviewed,
          lastNote: notes.get(c.technique_id) ?? null,
        },
      ];
    }),
  };
}
