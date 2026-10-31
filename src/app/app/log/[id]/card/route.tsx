import { createSupabaseServer } from "@/lib/supabase/server";
import { shareCardImage, type ShareItem } from "@/lib/share-card";

// 기록 공유 이미지 (D-51) — 그 사람 기록으로만(RLS) 만들고 어디에도 저장하지 않는다.
// 넣을 것(2026-10-31 본인 요청): ?techniques=0 기술 카드 빼기 · ?body=0 내 글 빼기 · ?sparring=0 스파링 빼기 / 배경: ?bg=white 흰색(기본 투명)
export async function GET(request: Request, ctx: RouteContext<"/app/log/[id]/card">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("not found", { status: 404 });
  const q = new URL(request.url).searchParams;
  const withBody = q.get("body") !== "0";
  const withTechniques = q.get("techniques") !== "0";
  const withSparring = q.get("sparring") !== "0";
  const background = q.get("bg") === "white" ? "white" : "clear";

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("class_logs")
    .select("logged_on, body, sparring_rounds, class_log_techniques(created_at, custom_name, techniques(name_ko, positions(slug, name_ko)))")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("share card failed:", error.code ?? "");
    return new Response("error", { status: 500 });
  }
  if (!data) return new Response("not found", { status: 404 }); // 남의 기록 · 로그인 안 함 → RLS 로 안 보임

  const items = [...data.class_log_techniques]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .flatMap((l): ShareItem[] => {
      const t = l.techniques;
      if (t) return [{ name: t.name_ko, position: t.positions?.name_ko ?? "", positionSlug: t.positions?.slug ?? null }];
      return l.custom_name ? [{ name: l.custom_name, position: "직접 적은 이름", positionSlug: null }] : [];
    });

  return shareCardImage(
    {
      loggedOn: data.logged_on,
      body: withBody ? data.body.trim() : "",
      items: withTechniques ? items : [],
      sparring: withSparring ? (data.sparring_rounds ?? 0) : 0,
      background,
      emptyNote: withTechniques && withSparring, // 기술 · 스파링을 일부러 뺀 게 아니면 "기술 이름 없이 기록했어요"
    },
    {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="rereroll-${data.logged_on}.png"`,
    },
  );
}
