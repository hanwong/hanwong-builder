-- D-50 · T-40 (M2-03): 사용자 기술 내용 보완 제안 → 운영자 승인.
-- 사용자는 자기 제안만 보고 넣는다(대기 10개까지). 운영자는 전부 보고, 승인은 운영자 확인 함수로만.

create table public.technique_suggestions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  technique_id uuid not null references public.techniques(id),
  steps        text[] not null,                    -- 제안한 세팅 과정 전체(3~5줄)
  add_aliases  text[] not null default '{}',       -- 더할 다른 이름(최대 5)
  reason       text,                               -- 이유 한 줄(선택)
  status       text not null default 'pending',
  decided_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint technique_suggestions_status check (status in ('pending','approved','rejected')),
  constraint technique_suggestions_steps check (array_length(steps, 1) between 3 and 5),
  constraint technique_suggestions_aliases check (coalesce(array_length(add_aliases, 1), 0) <= 5),
  constraint technique_suggestions_reason check (reason is null or char_length(reason) <= 200)
);
-- 한 기술에 내 대기 제안은 하나
create unique index technique_suggestions_one_pending on public.technique_suggestions (user_id, technique_id) where status = 'pending';
create index technique_suggestions_status_idx on public.technique_suggestions (status, created_at);
create index technique_suggestions_technique_idx on public.technique_suggestions (technique_id);
alter table public.technique_suggestions enable row level security;

create policy "suggestions: 자기 것 보기" on public.technique_suggestions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "suggestions: 자기 것 보내기 (대기 10개까지)" on public.technique_suggestions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending' and decided_at is null
    and (select count(*) from public.technique_suggestions s where s.user_id = (select auth.uid()) and s.status = 'pending') < 10
  );
create policy "suggestions: 운영자 보기" on public.technique_suggestions for select to authenticated
  using ((select public.is_operator()));
create policy "suggestions: 운영자 버림" on public.technique_suggestions for update to authenticated
  using ((select public.is_operator())) with check ((select public.is_operator()) and status in ('pending','rejected'));

-- 운영자: 승인 — 운영자가 최종으로 고친 세팅 과정 · 더할 다른 이름을 기술에 반영하고, 보낸 사람에게 알림
create or replace function public.approve_technique_suggestion(p_id uuid, p_steps text[], p_aliases text[])
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  s     public.technique_suggestions%rowtype;
  tname text;
  added int := 0;
  a     text;
begin
  if not public.is_operator() then raise exception 'not operator' using errcode = '42501'; end if;
  select * into s from public.technique_suggestions where id = p_id for update;
  if not found then raise exception 'suggestion not found'; end if;
  if s.status <> 'pending' then raise exception 'already decided'; end if;
  if coalesce(array_length(p_steps, 1), 0) not between 3 and 5
     or exists (select 1 from unnest(p_steps) x where btrim(x) = '' or char_length(x) > 120) then
    raise exception 'steps must be 3-5 lines';
  end if;

  update public.techniques set steps = p_steps where id = s.technique_id returning name_ko into tname;
  -- 다른 이름은 더하기만(이미 있는 이름 · 기술 이름과 같으면 건너뜀)
  foreach a in array coalesce(p_aliases, '{}') loop
    a := btrim(a);
    continue when a = '' or char_length(a) > 40;
    update public.techniques t
       set aliases = array_append(t.aliases, a)
     where t.id = s.technique_id
       and public.name_key(a) not in (public.name_key(t.name_ko), public.name_key(t.name_en))
       and not exists (select 1 from unnest(t.aliases) x where public.name_key(x) = public.name_key(a));
    if found then added := added + 1; end if;
  end loop;

  update public.technique_suggestions set status = 'approved', decided_at = now() where id = s.id;
  insert into public.notices (user_id, message, technique_id)
    values (s.user_id, left('보완 제안이 반영됐어요 — ' || tname, 200), s.technique_id);
  return jsonb_build_object('technique_id', s.technique_id, 'aliases_added', added);
end $$;
revoke execute on function public.approve_technique_suggestion(uuid, text[], text[]) from public, anon;
grant execute on function public.approve_technique_suggestion(uuid, text[], text[]) to authenticated;
