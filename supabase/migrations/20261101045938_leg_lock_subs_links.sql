-- D-109: 오늘 추가한 하체 서브미션을 다른 포지션에서 — 토홀드(하프가드 탑 · 데라히바 · 50/50) · 니바 · 힐훅(50/50)
-- 초안 5개(승인 대기)로 가는 줄을 원래 포지션 기술 '막히면'과 포지션 노트에 붙인다. 링크는 이름으로 맞추므로
-- 승인 전에는 비슷한 이름(토홀드 (앵클락 자세에서) 등)으로 이어지고, 승인되면 정확한 카드로 이어진다. 같은 줄이 있으면 건너뛴다.

create temporary table _links (slug text primary key, line text not null) on commit drop;
insert into _links (slug, line) values
  ('smash-pass',         '상대 니 쉴드 발이 내 골반 옆에 떠 있으면 → 토홀드 (하프가드 탑 · 니 쉴드 상대)'),
  ('berimbolo-entry',    '상대가 엉덩이를 앉혀 막고 오른발이 바닥에서 뜨면 → 토홀드 (데라히바 · 베림볼로에서)'),
  ('de-la-riva-guard',   '상대가 앉아 오른발이 바닥에서 뜨면 → 토홀드 (데라히바 · 베림볼로에서)'),
  ('fifty-fifty-guard',  '상대가 뒤꿈치를 숨기고 다리를 쭉 펴면 → 니바 (50/50) · 뒤꿈치가 드러나면 힐훅 (50/50)(노기 브라운 · 블랙만)');

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

-- 50/50 의 토홀드 줄은 50/50 전용 카드로
update public.techniques
   set if_blocked = array(select replace(x, '→ 토홀드 (앵클락 자세에서)', '→ 토홀드 (50/50)') from unnest(if_blocked) with ordinality u(x, i) order by i)
 where slug = 'fifty-fifty-guard' and owner_id is null;

-- 포지션 노트
update public.position_notes n
   set decisions = array(
     select case when d like '상대가 뒤로 버티며 서 있으면%' and position('토홀드' in d) = 0
                 then d || ' · 앉아 발이 뜨면 토홀드 (데라히바 · 베림볼로에서)' else d end
     from unnest(n.decisions) with ordinality u(d, i) order by i)
  from public.positions p
 where p.id = n.position_id and p.slug = 'de-la-riva' and n.role = 'bottom';

update public.position_notes n
   set decisions = array(
     select case when d like '상대가 니 쉴드로 막고 있으면%' and position('토홀드' in d) = 0
                 then d || ' · 니 쉴드 발이 떠 있으면 토홀드 (하프가드 탑 · 니 쉴드 상대)' else d end
     from unnest(n.decisions) with ordinality u(d, i) order by i)
  from public.positions p
 where p.id = n.position_id and p.slug = 'half-guard' and n.role = 'top';
