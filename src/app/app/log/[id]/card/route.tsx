import { createSupabaseServer } from "@/lib/supabase/server";
import { shareCardImage, type ShareItem } from "@/lib/share-card";

// 기록 공유 이미지 (D-51) — 그 사람 기록으로만(RLS) 만들고 어디에도 저장하지 않는다. ?body=0 이면 내 글을 빼고 기술 이름만.
export async function GET(request: Request, ctx: RouteContext<"/app/log/[id]/card">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("not found", { status: 404 });
  const withBody = new URL(request.url).searchParams.get("body") !== "0";

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("class_logs")
    .select("logged_on, body, class_log_techniques(created_at, custom_name, techniques(name_ko, positions(slug, name_ko)))")
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
    { loggedOn: data.logged_on, body: withBody ? data.body.trim() : "", items },
    {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="rereroll-${data.logged_on}.png"`,
    },
  );
}
