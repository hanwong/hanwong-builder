-- D-47 · T-39 (M2-01): 목록 밖 기술 추가 자동화
-- operators(운영자) · technique_drafts(AI 초안, 운영자만) · notices(사용자 알림) + 운영자 전용 DB 함수.
-- 다른 사람 기록을 건드리는 일은 security definer 함수 안에서만, 운영자인지 먼저 확인한다(비밀 키 없이).

-- 이름 비교 기준: 띄어쓰기 · 대소문자 무시
create or replace function public.name_key(t text) returns text
language sql immutable set search_path = '' as $$
  select lower(regexp_replace(coalesce(t, ''), '\s+', '', 'g'));
$$;

-- 운영자 ----------------------------------------------------------------------
create table public.operators (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.operators enable row level security;
create policy "operators: 자기 것 보기" on public.operators for select to authenticated
  using (user_id = (select auth.uid()));
-- 운영자는 한 명(본인 계정). 바꿀 때는 새 마이그레이션으로.
insert into public.operators (user_id)
select id from auth.users where id = '86ce14b5-60bf-49b3-a2a4-89099b89b459'
on conflict do nothing;

create or replace function public.is_operator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.operators where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_operator() from public, anon;
grant execute on function public.is_operator() to authenticated;

-- 초안 ------------------------------------------------------------------------
create table public.technique_drafts (
  id           uuid primary key default gen_random_uuid(),
  name_key     text not null unique,              -- public.name_key(적힌 이름) — 같은 이름은 한 번만
  custom_name  text not null,                     -- 사용자가 적은 이름(대표 하나)
  kind         text not null default 'new',       -- new 새 기술 · alias 있는 기술의 다른 이름 · unclear 기술 아님 같음
  alias_of     uuid references public.techniques(id),
  position_id  uuid references public.positions(id),
  slug         text,
  name_ko      text,
  name_en      text,
  aliases      text[] not null default '{}',
  steps        text[] not null default '{}',
  note         text,                              -- AI 가 그렇게 본 이유 한 줄
  status       text not null default 'pending',   -- pending 대기 · approved 승인 · rejected 버림
  technique_id uuid references public.techniques(id), -- 승인 뒤 연결된 기술
  decided_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint technique_drafts_kind check (kind in ('new','alias','unclear')),
  constraint technique_drafts_status check (status in ('pending','approved','rejected')),
  constraint technique_drafts_name_len check (char_length(custom_name) between 1 and 100)
);
create index technique_drafts_status_idx on public.technique_drafts (status, created_at);
create index technique_drafts_alias_of_idx on public.technique_drafts (alias_of);
create index technique_drafts_position_idx on public.technique_drafts (position_id);
create index technique_drafts_technique_idx on public.technique_drafts (technique_id);
alter table public.technique_drafts enable row level security;
create policy "drafts: 운영자 보기" on public.technique_drafts for select to authenticated using ((select public.is_operator()));
create policy "drafts: 운영자 추가" on public.technique_drafts for insert to authenticated with check ((select public.is_operator()));
create policy "drafts: 운영자 수정" on public.technique_drafts for update to authenticated
  using ((select public.is_operator())) with check ((select public.is_operator()));

-- 알림 ------------------------------------------------------------------------
create table public.notices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  message      text not null check (char_length(message) between 1 and 200),
  technique_id uuid references public.techniques(id),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index notices_user_unread_idx on public.notices (user_id, created_at desc) where read_at is null;
create index notices_technique_idx on public.notices (technique_id);
alter table public.notices enable row level security;
create policy "notices: 자기 것 보기" on public.notices for select to authenticated using (user_id = (select auth.uid()));
create policy "notices: 자기 것 확인" on public.notices for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- 추가는 아래 승인 함수만 한다.

-- 운영자: 아직 초안이 없는 적힌 이름 모으기 (이름 · 횟수만, 글 원문 · 사람 정보 없음) -----------------
create or replace function public.pending_custom_names()
returns table (name_key text, custom_name text, times bigint, people bigint, last_seen date)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_operator() then raise exception 'not operator' using errcode = '42501'; end if;
  return query
    select public.name_key(c.custom_name) as k,
           min(c.custom_name),
           count(*),
           count(distinct c.user_id),
           max(l.logged_on)
    from public.class_log_techniques c
    join public.class_logs l on l.id = c.class_log_id
    where c.custom_name is not null
      and public.name_key(c.custom_name) <> ''
      and not exists (select 1 from public.technique_drafts d where d.name_key = public.name_key(c.custom_name))
    group by k
    order by count(*) desc, max(l.logged_on) desc;
end $$;
revoke execute on function public.pending_custom_names() from public, anon;
grant execute on function public.pending_custom_names() to authenticated;

-- 운영자: 초안 카드에 "몇 번 · 몇 명" 을 보여 주기 위한 집계 -------------------------------
create or replace function public.custom_name_counts(keys text[])
returns table (name_key text, times bigint, people bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_operator() then raise exception 'not operator' using errcode = '42501'; end if;
  return query
    select public.name_key(c.custom_name), count(*), count(distinct c.user_id)
    from public.class_log_techniques c
    where c.custom_name is not null and public.name_key(c.custom_name) = any(keys)
    group by 1;
end $$;
revoke execute on function public.custom_name_counts(text[]) from public, anon;
grant execute on function public.custom_name_counts(text[]) to authenticated;

-- 운영자: 승인 — 기술 추가(또는 다른 이름 추가) → 그 이름으로 적힌 기록 연결 → 숙련도 · 카드 · 알림 -------
-- p_due: 새 카드의 복습일(서버가 서울 기준 내일로 계산해 넘긴다, DB.md 6)
create or replace function public.approve_technique_draft(p_draft uuid, p_due date)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  d      public.technique_drafts%rowtype;
  tid    uuid;
  tname  text;
  n_logs int;
  n_users int;
  users  uuid[];
begin
  if not public.is_operator() then raise exception 'not operator' using errcode = '42501'; end if;
  select * into d from public.technique_drafts where id = p_draft for update;
  if not found then raise exception 'draft not found'; end if;
  if d.status <> 'pending' then raise exception 'already decided'; end if;
  if p_due is null or p_due < current_date - 1 or p_due > current_date + 2 then raise exception 'bad due date'; end if;

  if d.kind = 'alias' then
    if d.alias_of is null then raise exception 'alias target missing'; end if;
    tid := d.alias_of;
    update public.techniques
       set aliases = case when d.custom_name = any(aliases) then aliases else array_append(aliases, d.custom_name) end
     where id = tid
     returning name_ko into tname;
    if not found then raise exception 'alias target not found'; end if;
  elsif d.kind = 'new' then
    if d.position_id is null or coalesce(d.slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       or coalesce(btrim(d.name_ko), '') = '' or coalesce(btrim(d.name_en), '') = ''
       or coalesce(array_length(d.steps, 1), 0) not between 3 and 5 then
      raise exception 'draft incomplete';
    end if;
    insert into public.techniques (position_id, slug, name_ko, name_en, aliases, steps, is_reviewed, source, sort_order)
    values (d.position_id, d.slug, btrim(d.name_ko), btrim(d.name_en),
            case when public.name_key(d.custom_name) in (public.name_key(d.name_ko), public.name_key(d.name_en)) or d.custom_name = any(d.aliases)
                 then d.aliases else array_append(d.aliases, d.custom_name) end,
            d.steps, true, '운영자 승인(앱 초안, D-47)',
            coalesce((select max(sort_order) from public.techniques where position_id = d.position_id), 0) + 1)
    returning id, name_ko into tid, tname;
  else
    raise exception 'unclear draft cannot be approved';
  end if;

  -- 그 이름으로 적힌 연결들 — 누가 · 몇 건인지 먼저 센다
  select coalesce(array_agg(distinct c.user_id), '{}'), count(distinct c.class_log_id), count(distinct c.user_id)
    into users, n_logs, n_users
  from public.class_log_techniques c
  where c.custom_name is not null and public.name_key(c.custom_name) = d.name_key;

  -- 같은 기록에 이미 그 기술이 있거나 같은 이름이 두 번 적혔으면 하나만 남긴다(유일 제약)
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
  insert into public.review_cards (user_id, technique_id, interval_step, due_on)
    select u, tid, 0, p_due from unnest(users) as u
  on conflict (user_id, technique_id) do nothing;
  insert into public.notices (user_id, message, technique_id)
    select u, left('‘' || d.custom_name || '’ 이(가) 기술 목록에 추가됐어요 — ' || tname, 200), tid from unnest(users) as u;

  update public.technique_drafts set status = 'approved', technique_id = tid, decided_at = now() where id = d.id;
  return jsonb_build_object('technique_id', tid, 'logs', n_logs, 'users', n_users);
end $$;
revoke execute on function public.approve_technique_draft(uuid, date) from public, anon;
grant execute on function public.approve_technique_draft(uuid, date) to authenticated;
