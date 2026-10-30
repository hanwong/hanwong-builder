// data/techniques.json → 마이그레이션 SQL (표준 출력).
// 쓰는 법:
//   npx supabase migration new techniques_update        # 빈 파일 생성
//   node scripts/techniques-to-sql.mjs > supabase/migrations/<방금 생긴 파일>.sql
//   npx supabase db push
// positions · techniques 둘 다 slug 가 같으면 덮어쓰고(upsert), 없으면 새로 넣는다. slug 는 바꾸지 말 것.
// JSON 에서 지운 기술은 DB 에서 지우지 않는다(기록 · 카드가 연결돼 있을 수 있음) — 필요하면 별도 마이그레이션으로.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "data", "techniques.json");
const { techniques, positions = [], meta } = JSON.parse(readFileSync(file, "utf8"));

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (list) => (list.length ? `array[${list.map(q).join(",")}]::text[]` : "array[]::text[]");

const posSlugs = new Set(positions.map((p) => p.slug));
const slugs = new Set();
for (const t of techniques) {
  for (const k of ["position", "slug", "name_ko", "name_en"]) {
    if (!t[k]) throw new Error(`${t.slug ?? "?"}: ${k} 비어 있음`);
  }
  if (slugs.has(t.slug)) throw new Error(`slug 중복: ${t.slug}`);
  slugs.add(t.slug);
  if (positions.length && !posSlugs.has(t.position)) throw new Error(`${t.slug}: 모르는 포지션 ${t.position}`);
  if (!Array.isArray(t.aliases) || !Array.isArray(t.steps)) throw new Error(`${t.slug}: aliases/steps 는 배열`);
  if (t.draft === false && (t.steps.length < 3 || t.steps.length > 5))
    throw new Error(`${t.slug}: 검수 완료(draft=false)면 세팅 과정 3~5줄`);
}

let out = `-- data/techniques.json 에서 생성 (scripts/techniques-to-sql.mjs). 직접 고치지 말고 JSON 을 고친다.\n`;

if (positions.length) {
  const prow = positions
    .map((p) => `  (${q(p.slug)}, ${q(p.name_ko)}, ${q(p.name_en)}, ${Number(p.sort) || 0})`)
    .join(",\n");
  out += `-- 포지션 ${positions.length}개 · slug 기준 upsert
insert into public.positions (slug, name_ko, name_en, sort_order)
values
${prow}
on conflict (slug) do update set
  name_ko    = excluded.name_ko,
  name_en    = excluded.name_en,
  sort_order = excluded.sort_order;

`;
}

const rows = techniques
  .map(
    (t) =>
      `  (${q(t.position)}, ${q(t.slug)}, ${q(t.name_ko)}, ${q(t.name_en)}, ${arr(t.aliases)}, ${arr(t.steps)}, ${
        t.draft === false ? "true" : "false"
      }, ${q(t.source ?? meta.source)}, ${Number(t.sort) || 0}, ${t.kind ? q(t.kind) : "null"}, ${t.role ? q(t.role) : "null"}, ${arr(t.ends_at ?? [])}, ${arr(t.key_points ?? [])}, ${arr(t.mistakes ?? [])}, ${arr(t.if_blocked ?? [])}, ${arr(t.defense ?? [])})`,
  )
  .join(",\n");

out += `-- 기술 ${techniques.length}개 · slug 기준 upsert
insert into public.techniques (position_id, slug, name_ko, name_en, aliases, steps, is_reviewed, source, sort_order, kind, role, ends_at, key_points, mistakes, if_blocked, defense)
select p.id, t.slug, t.name_ko, t.name_en, t.aliases, t.steps, t.is_reviewed, t.source, t.sort_order, t.kind, t.role, t.ends_at, t.key_points, t.mistakes, t.if_blocked, t.defense
from (values
${rows}
) as t(position_slug, slug, name_ko, name_en, aliases, steps, is_reviewed, source, sort_order, kind, role, ends_at, key_points, mistakes, if_blocked, defense)
join public.positions p on p.slug = t.position_slug
on conflict (slug) do update set
  position_id = excluded.position_id,
  name_ko     = excluded.name_ko,
  name_en     = excluded.name_en,
  aliases     = excluded.aliases,
  steps       = excluded.steps,
  is_reviewed = excluded.is_reviewed,
  source      = excluded.source,
  sort_order  = excluded.sort_order,
  kind        = excluded.kind,
  role        = excluded.role,
  ends_at     = excluded.ends_at,
  key_points  = excluded.key_points,
  mistakes    = excluded.mistakes,
  if_blocked  = excluded.if_blocked,
  defense     = excluded.defense;
`;
process.stdout.write(out);
