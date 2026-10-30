// DB(techniques · positions) → data/techniques.json (D-47: 기술 목록 원본은 DB).
// 운영 화면에서 승인한 기술 · 다른 이름이 DB 에만 있으므로, JSON 을 고치기 전에 이걸 먼저 돌려 받아 온다.
// 쓰는 법:
//   SUPABASE_ACCESS_TOKEN=... node scripts/techniques-from-db.mjs      # 토큰은 화면 · 커밋에 남기지 않는다
// 프로젝트는 supabase/.temp/project-ref(supabase link 가 만든 파일)에서 읽는다.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "data", "techniques.json");
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("SUPABASE_ACCESS_TOKEN 이 없어요");
const ref = process.env.SUPABASE_PROJECT_REF ?? readFileSync(join(root, "supabase", ".temp", "project-ref"), "utf8").trim();

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`DB 읽기 실패 ${res.status}`);
  return res.json();
}

const positions = await query("select slug, name_ko, name_en, sort_order from public.positions order by sort_order");
const techniques = await query(`
  select p.slug as position, t.slug, t.name_ko, t.name_en, t.aliases, t.steps, t.is_reviewed, t.source, t.sort_order,
         t.kind, t.role, t.ends_at, t.key_points, t.mistakes, t.if_blocked, t.defense
  from public.techniques t join public.positions p on p.id = t.position_id
  order by p.sort_order, t.sort_order, t.created_at`);

const old = JSON.parse(readFileSync(file, "utf8"));
const meta = {
  ...old.meta,
  what: "Re:Re:롤 기술 라이브러리 사본. 원본은 DB(D-47) — 고치기 전에 `node scripts/techniques-from-db.mjs` 로 받아 오고, 고친 뒤 `node scripts/techniques-to-sql.mjs > supabase/migrations/<새 파일>.sql` 로 DB 에 반영한다.",
};

// 한 줄에 하나 — 기존 파일과 같은 모양(바뀐 줄만 diff 에 보이게)
const value = (v) => (Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(", ")}]` : JSON.stringify(v));
const line = (o) => `{${Object.entries(o).map(([k, v]) => `${JSON.stringify(k)}: ${value(v)}`).join(", ")}}`;

const out = `{
  "meta": ${JSON.stringify(meta, null, 4).replace(/\n}$/, "\n  }")},
  "positions": [
${positions.map((p) => "    " + line({ slug: p.slug, name_ko: p.name_ko, name_en: p.name_en, sort: p.sort_order })).join(",\n")}
  ],
  "techniques": [
${techniques
  .map(
    (t) =>
      "    " +
      line({
        position: t.position,
        slug: t.slug,
        name_ko: t.name_ko,
        name_en: t.name_en,
        aliases: t.aliases ?? [],
        steps: t.steps,
        draft: !t.is_reviewed,
        source: t.source ?? "",
        sort: t.sort_order,
        // 기술 지도(D-81)
        kind: t.kind ?? null,
        role: t.role ?? null,
        ends_at: t.ends_at ?? [],
        key_points: t.key_points ?? [],
        mistakes: t.mistakes ?? [],
        if_blocked: t.if_blocked ?? [],
        defense: t.defense ?? [],
      }),
  )
  .join(",\n")}
  ]
}
`;
JSON.parse(out); // 깨진 파일은 쓰지 않는다
writeFileSync(file, out);
console.log(`포지션 ${positions.length}개 · 기술 ${techniques.length}개를 받아 왔어요.`);
