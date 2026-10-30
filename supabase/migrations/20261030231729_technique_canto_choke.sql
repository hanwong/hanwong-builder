-- 칸토 초크 추가 · 대기 목록 승인 (D-89). 운영 초안(technique_drafts)이 '확신 없음'으로 막혀 있던 것을
-- 조사(LowKick MMA · Evolve University · Digitsu — 사실만 참고, 문장은 우리 말로)해 카드로 쓰고, approve_technique_draft 와 같은 순서로 승인한다.
-- 좌우: 자료는 '아래 발 · 위 다리'로만 적어, 같은 원리인 '루프 초크 (가드)' 카드(내 오른손 · 상대 왼쪽 깃, 내 왼쪽으로 몸을 돌림)에 맞췄다.
do $$
declare
  draft_id uuid := '4dbb0376-2fd8-48a0-aef8-90ade248f639';
  d public.technique_drafts%rowtype;
  pos uuid;
  tid uuid;
  users uuid[];
begin
  select * into d from public.technique_drafts where id = draft_id and status = 'pending' for update;
  if not found then return; end if; -- 이미 처리됐으면 건너뜀
  select id into pos from public.positions where slug = 'closed-guard';

  insert into public.techniques (position_id, slug, name_ko, name_en, aliases, steps, is_reviewed, source, sort_order,
                                 kind, role, ends_at, key_points, mistakes, if_blocked, defense)
  values (pos, 'canto-choke', '칸토 초크 (가드)', 'Canto Choke',
    array['칸토초크','칸토 초크','플라비오 칸토 초크','Canto Choke']::text[],
    array[
      '클로즈드 가드에서 내 오른손으로 상대 왼쪽 깃을 목 옆 가까이 얕게 잡는다(엄지가 깃 안쪽, 조금 여유를 남긴다)',
      '가드를 풀고 내 왼발로 상대 오른쪽 허벅지를 밀며 내 왼손으로 상대 오른팔을 막아 공간을 만든다',
      '엉덩이를 들며 내 왼쪽으로 몸을 살짝 돌리고 내 오른다리를 올려 오금 · 종아리를 상대 뒤통수에 건다',
      '오른손으로 깃을 당기는 동시에 오른다리로 상대 머리를 힘껏 내리찍는다',
      '천천히 조인다 · 탭하면 바로 푼다'
    ]::text[],
    true, '운영자 승인(대기 목록, D-89) · AI 초안(우리 말로 작성) · 참고: LowKick MMA · Evolve University · Digitsu',
    coalesce((select max(sort_order) from public.techniques where position_id = pos), 0) + 1,
    'submission', 'bottom', '{}'::text[],
    array[
      '깃은 목 옆에서 얕게 잡는다 — 다리로 머리를 내릴 때 깃이 목을 감으며 조여진다',
      '다리를 올리기 전에 내 왼발 · 왼손으로 공간부터 만든다 — 공간이 없으면 다리가 뒤통수에 걸리지 않는다',
      '내 오른쪽 오금이나 종아리가 정확히 상대 뒤통수에 닿아야 한다',
      '도복 깃을 쓰는 기술이라 노기에서는 쓸 수 없다'
    ]::text[],
    array[
      '공간 없이 다리부터 올리면 상대가 머리를 들어 빠진다 → 왼발 · 왼손으로 먼저 거리를 만든다',
      '팔로만 깃을 당기면 힘만 빠진다 → 다리로 머리를 내리찍는 힘과 같이 쓴다',
      '다리가 목이나 어깨에 걸리면 조이지 않는다 → 오금을 뒤통수에 정확히 댄다'
    ]::text[],
    array[
      '상대가 머리를 빼면 → 오모플라타',
      '상대가 일어서면 → 상대가 섰을 때 클로즈드 가드 유지',
      '상대가 고개를 숙인 채 버티면 → 루프 초크 (가드)'
    ]::text[],
    array[
      '상대 오른손이 내 왼쪽 깃을 목 옆에서 잡고 상대 왼발이 내 오른쪽 허벅지를 밀어 공간을 만들면 칸토 초크 신호',
      '깃 그립부터 두 손으로 떼고 허리를 세워 자세를 지킨다',
      '상대 오른다리가 올라오면 손으로 막아 뒤통수에 걸리지 않게 하고 턱을 당겨 목 옆을 지킨다',
      '다리가 걸려 목이 조여 오면 버티지 말고 탭한다'
    ]::text[])
  returning id into tid;

  -- 그 이름으로 적힌 기록 연결을 새 기술로(같은 기록에 두 번이면 하나만)
  select coalesce(array_agg(distinct c.user_id), '{}') into users
  from public.class_log_techniques c
  where c.custom_name is not null and public.name_key(c.custom_name) = d.name_key;
  delete from public.class_log_techniques c
   where c.custom_name is not null and public.name_key(c.custom_name) = d.name_key
     and (exists (select 1 from public.class_log_techniques x where x.class_log_id = c.class_log_id and x.technique_id = tid)
          or exists (select 1 from public.class_log_techniques y
                      where y.class_log_id = c.class_log_id and y.custom_name is not null
                        and public.name_key(y.custom_name) = d.name_key and (y.created_at, y.id) < (c.created_at, c.id)));
  update public.class_log_techniques set technique_id = tid, custom_name = null
   where custom_name is not null and public.name_key(custom_name) = d.name_key;
  insert into public.technique_levels (user_id, technique_id, level)
    select u, tid, 'beginner' from unnest(users) as u
  on conflict (user_id, technique_id) do nothing;
  insert into public.notices (user_id, message, technique_id)
    select u, left('‘' || d.custom_name || '’ 이(가) 기술 목록에 추가됐어요 — 칸토 초크 (가드)', 200), tid from unnest(users) as u;

  update public.technique_drafts
     set kind = 'new', position_id = pos, slug = 'canto-choke', name_ko = '칸토 초크 (가드)', name_en = 'Canto Choke',
         note = '조사 뒤 운영 승인(D-89) — 플라비오 칸토의 깃 초크, 가드에서 다리로 머리를 내리찍는 방식',
         status = 'approved', technique_id = tid, decided_at = now()
   where id = draft_id;
end $$;
