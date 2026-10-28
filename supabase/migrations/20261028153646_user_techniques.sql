-- D-57 · T-44: 사용자가 목록 밖 이름을 AI 로 채운 '내 기술' — 만든 사람만 보고, 운영자가 승인하면 공용.
-- owner_id 가 비어 있으면 공용 기술. owner_status: pending 승인 대기 · rejected 버림(만든 사람에게만 계속 보임).

alter table public.techniques
  add column owner_id uuid references auth.users(id) on delete cascade,
  add column owner_status text,
  add constraint techniques_owner_status check (
    (owner_id is null and owner_status is null)
    or (owner_id is not null and owner_status in ('pending', 'rejected'))
  );
create index techniques_owner_idx on public.techniques (owner_id) where owner_id is not null;

-- 읽기: 공용 + 내가 만든 것 + 운영자는 전부
drop policy if exists "techniques: 로그인 보기 (초안 포함)" on public.techniques;
create policy "techniques: 공용 · 내 것 · 운영자 보기" on public.techniques
  for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()) or (select public.is_operator()));

-- 추가: 본인 것만, 승인 대기 · 검수 전으로만
create policy "techniques: 내 기술 추가" on public.techniques
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and owner_status = 'pending' and is_reviewed = false);

-- 계정을 지우면 내 기술도 같이 지워진다. 그 기술을 가리키는 내 연결 · 숙련도 · 카드도 같은 삭제에서 지워지므로
-- 기술 쪽 연결 검사를 '즉시 막음(restrict)' 대신 '문장 끝에 검사(no action)' 로 바꾼다 — 평소에는 똑같이 막는다.
alter table public.class_log_techniques drop constraint class_log_techniques_technique_id_fkey,
  add constraint class_log_techniques_technique_id_fkey foreign key (technique_id) references public.techniques(id);
alter table public.technique_levels drop constraint technique_levels_technique_id_fkey,
  add constraint technique_levels_technique_id_fkey foreign key (technique_id) references public.techniques(id);
alter table public.review_cards drop constraint review_cards_technique_id_fkey,
  add constraint review_cards_technique_id_fkey foreign key (technique_id) references public.techniques(id);

-- AI 호출 기록: 사용자의 '내용 생성'(user_draft)도 센다 — 하루 3번
alter table public.ai_calls drop constraint if exists ai_calls_kind_check;
alter table public.ai_calls add constraint ai_calls_kind_check check (kind in ('organize', 'redraft', 'user_draft'));
drop policy if exists "ai_calls: 자기 것 추가" on public.ai_calls;
create policy "ai_calls: 자기 것 추가" on public.ai_calls
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (kind in ('organize', 'user_draft') or (select public.is_operator())));

-- 운영자: 사용자가 만든 기술 승인 — 고친 내용으로 공용 기술이 되고, 만든 사람에게 알림 -----------------------
create or replace function public.approve_user_technique(
  p_id uuid, p_position text, p_name_ko text, p_name_en text, p_steps text[]
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t   public.techniques%rowtype;
  pid uuid;
begin
  if not public.is_operator() then raise exception 'not operator' using errcode = '42501'; end if;
  select * into t from public.techniques where id = p_id for update;
  if not found or t.owner_id is null then raise exception 'not a user technique'; end if;
  select id into pid from public.positions where slug = p_position;
  if pid is null then raise exception 'position not found'; end if;
  if coalesce(btrim(p_name_ko), '') = '' or coalesce(btrim(p_name_en), '') = ''
     or coalesce(array_length(p_steps, 1), 0) not between 3 and 5 then
    raise exception 'incomplete';
  end if;

  update public.techniques
     set position_id = pid,
         name_ko = btrim(p_name_ko),
         name_en = btrim(p_name_en),
         steps = p_steps,
         is_reviewed = true,
         owner_id = null,
         owner_status = null,
         source = '사용자 생성 → 운영자 승인(D-57)',
         sort_order = coalesce((select max(sort_order) from public.techniques where position_id = pid and owner_id is null), 0) + 1
   where id = p_id;

  insert into public.notices (user_id, message, technique_id)
  values (t.owner_id, left('직접 만든 ‘' || btrim(p_name_ko) || '’ 이(가) 승인돼 모두의 기술 목록에 들어갔어요', 200), p_id);
end $$;
revoke execute on function public.approve_user_technique(uuid, text, text, text, text[]) from public, anon;
grant execute on function public.approve_user_technique(uuid, text, text, text, text[]) to authenticated;

-- 운영자: 버림 — 만든 사람에게만 계속 보인다(기록 · 카드는 그대로)
create or replace function public.reject_user_technique(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_operator() then raise exception 'not operator' using errcode = '42501'; end if;
  update public.techniques set owner_status = 'rejected'
   where id = p_id and owner_id is not null and owner_status = 'pending';
  if not found then raise exception 'not pending'; end if;
end $$;
revoke execute on function public.reject_user_technique(uuid) from public, anon;
grant execute on function public.reject_user_technique(uuid) to authenticated;
