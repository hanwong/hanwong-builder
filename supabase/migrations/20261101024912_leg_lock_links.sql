-- D-107: 다른 가드에서 하체 관절기(D-105, 2026-11-01 승인 6개)로 이어지는 줄.
-- 기술의 '막히면'(if_blocked)에 한 줄씩 더하고, 포지션 노트의 '상대가 ~하면 → 기술'(decisions)은 맞는 줄에 붙인다.
-- 링크는 읽을 때 이름으로 맞추므로(links.ts) 기술 이름을 그대로 쓴다. 힐훅으로 가는 줄엔 허용 띠를 짧게 붙인다.
-- 같은 줄이 이미 있으면 다시 넣지 않는다(두 번 올려도 같음).

create temporary table _links (slug text primary key, line text not null) on commit drop;
insert into _links (slug, line) values
  -- 가드 → 애시 가라미 · 새들 진입
  ('butterfly-guard-to-x-guard',   '상대가 일어서며 다리를 빼면 → 애시 가라미 (스트레이트 애시)'),
  ('de-la-riva-to-x-guard',        '상대가 앞다리를 들어 X 훅을 피하면 → 애시 가라미 (스트레이트 애시)'),
  ('half-guard-to-x-guard',        '상대 왼다리가 떠서 무릎이 안으로 돌면 → 애시 가라미 (스트레이트 애시)'),
  ('deep-half-to-x-guard',         '안고 있는 상대 오른다리가 펴지며 빠지려 하면 → 애시 가라미 (스트레이트 애시)'),
  ('shin-to-shin-to-single-leg-x', '상대가 무릎을 안으로 돌려 버티면 → 애시 가라미 (스트레이트 애시)'),
  ('k-guard-to-single-leg-x',      '상대가 무릎을 안으로 넣어 버티면 → 인사이드 힐훅 (새들 · 인사이드 산카쿠) — 노기 브라운 · 블랙만'),
  ('single-leg-x-guard',           '상대가 무릎을 안으로 돌려 버티면 → 애시 가라미 (스트레이트 애시)'),
  ('x-guard-to-single-leg-x',      '상대가 발끝을 돌려 버티면 → 토홀드 (앵클락 자세에서)'),
  -- 하체 관절기끼리
  ('straight-ankle-lock',          '상대가 발끝을 돌려 발등이 드러나면 → 토홀드 (앵클락 자세에서) · 뒤꿈치가 드러나면 아웃사이드 힐훅 (스트레이트 애시)(노기 브라운 · 블랙만)'),
  -- 위(패스) 쪽
  ('half-guard-pass',              '상대가 니 쉴드 다리를 쭉 펴 밀면 → 니바 (하프가드 탑 · 스텝 오버)'),
  -- 당하는 쪽 방어
  ('standing-escape-from-slx',     '상대가 내 뒤꿈치를 겨드랑이에 끼우면 → 하체 관절기 방어 (무릎 선 지키기 · 뒤꿈치 숨기기)'),
  ('knee-extraction',              '상대가 뒤꿈치를 팔꿈치에 걸면 → 하체 관절기 방어 (무릎 선 지키기 · 뒤꿈치 숨기기) · 걸렸으면 바로 탭'),
  ('backstep-from-single-leg-x',   '상대가 내 다리를 삼각형으로 감아 오면 → 하체 관절기 방어 (무릎 선 지키기 · 뒤꿈치 숨기기)');

do $$
declare missing text;
begin
  select string_agg(l.slug, ', ') into missing
  from _links l left join public.techniques t on t.slug = l.slug and t.owner_id is null where t.id is null;
  if missing is not null then raise exception 'technique not found: %', missing; end if;
end $$;

update public.techniques t
   set if_blocked = t.if_blocked || l.line
  from _links l
 where t.slug = l.slug and t.owner_id is null and not (l.line = any(t.if_blocked));

-- 포지션 노트: 맞는 줄 뒤에 붙인다(줄 수는 그대로). 이미 붙었으면 건너뛴다.
create temporary table _notes (pos text, role text, starts text, tail text, primary key (pos, role, starts)) on commit drop;
insert into _notes values
  ('x-guard',         'bottom', '상대 왼발이 내 오른쪽 겨드랑이에 안긴 채 서 있으면', ' · 무릎을 안으로 돌려 버티면 애시 가라미 (스트레이트 애시)'),
  ('x-guard',         'top',    '상대가 내 왼발에 앵클락을 걸면',                   ' · 힐훅 · 토홀드를 노리면 하체 관절기 방어 (무릎 선 지키기 · 뒤꿈치 숨기기)'),
  ('butterfly-guard', 'bottom', '상대가 뒤로 버티며 서려 하면',                     ' · 다리를 빼며 일어서면 애시 가라미 (스트레이트 애시)'),
  ('de-la-riva',      'bottom', '상대가 다리 쪽으로 넘어오려 하면',                 ' · 앞다리를 들어 피하면 애시 가라미 (스트레이트 애시)'),
  ('half-guard',      'top',    '상대가 니 쉴드로 막고 있으면',                     ' · 니 쉴드 다리를 쭉 펴 밀면 니바 (하프가드 탑 · 스텝 오버)'),
  ('open-guard',      'top',    '상대가 케이 가드로 다리를 노리면',                 ' · 다리가 감기면 하체 관절기 방어 (무릎 선 지키기 · 뒤꿈치 숨기기)'),
  ('deep-half',       'bottom', '상대가 다리를 빼려 일어서면',                     ' · 다리가 펴지며 빠지면 애시 가라미 (스트레이트 애시)');

do $$
declare missing text;
begin
  select string_agg(x.pos || '/' || x.role, ', ') into missing
  from _notes x
  where not exists (
    select 1 from public.position_notes n join public.positions p on p.id = n.position_id
    where p.slug = x.pos and n.role = x.role and exists (select 1 from unnest(n.decisions) d where d like x.starts || '%'));
  if missing is not null then raise exception 'note line not found: %', missing; end if;
end $$;

update public.position_notes n
   set decisions = array(
     select case when d like x.starts || '%' and position(x.tail in d) = 0 then d || x.tail else d end
     from unnest(n.decisions) with ordinality as u(d, i) order by i)
  from public.positions p, _notes x
 where p.id = n.position_id and p.slug = x.pos and n.role = x.role;
