-- D-127 관장님 버전(M3-G) — 표 6개 · 기존 표 칸 2개 · 접근 규칙 · 함수 (DB.md 11).
-- 원칙: 기록은 사람 것(체육관 표는 가리키기만). 관장 · 코치는 자기 체육관 관원의 기록을 관원이 체육관에 있는 동안만 본다(메모 · 스파링 포함, 동의 뒤).
-- 관원끼리는 아무것도 못 본다. 이메일은 어디서도 안 나간다(닉네임은 함수로).

-- ---------- 표 ----------
create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  region_si text,
  region_gu text,
  join_code text not null unique check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  coach_code text not null unique check (coach_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.gym_members (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','coach','member')),
  consented_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  unique (gym_id, user_id)
);
create index if not exists gym_members_user_idx on public.gym_members (user_id);

create table if not exists public.gym_schedules (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 20),
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  minutes smallint not null default 60 check (minutes between 15 and 240),
  coach_id uuid references auth.users(id) on delete set null,
  active_from date not null default (now() at time zone 'Asia/Seoul')::date,
  active_until date,
  created_at timestamptz not null default now()
);
create index if not exists gym_schedules_gym_idx on public.gym_schedules (gym_id);

create table if not exists public.gym_classes (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  schedule_id uuid references public.gym_schedules(id) on delete set null,
  held_on date not null,
  name text not null check (char_length(btrim(name)) between 1 and 20),
  starts_at time not null,
  status text not null default 'posted' check (status in ('posted','canceled')),
  body text not null default '' check (char_length(body) <= 2000),
  posted_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists gym_classes_once_uidx on public.gym_classes (gym_id, schedule_id, held_on) where schedule_id is not null;
create index if not exists gym_classes_gym_day_idx on public.gym_classes (gym_id, held_on);

create table if not exists public.gym_class_techniques (
  id uuid primary key default gen_random_uuid(),
  gym_class_id uuid not null references public.gym_classes(id) on delete cascade,
  technique_id uuid references public.techniques(id) on delete cascade,
  custom_name text check (custom_name is null or char_length(btrim(custom_name)) between 1 and 60),
  sort_order smallint not null default 0,
  check (technique_id is not null or custom_name is not null)
);
create index if not exists gym_class_techniques_class_idx on public.gym_class_techniques (gym_class_id);

create table if not exists public.gym_attendance (
  id uuid primary key default gen_random_uuid(),
  gym_class_id uuid not null references public.gym_classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  class_log_id uuid references public.class_logs(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (gym_class_id, user_id)
);

create table if not exists public.log_comments (
  id uuid primary key default gen_random_uuid(),
  class_log_id uuid not null references public.class_logs(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists log_comments_log_idx on public.log_comments (class_log_id);

-- 기존 표에 더하는 칸
alter table public.class_logs add column if not exists gym_class_id uuid references public.gym_classes(id) on delete set null;
create index if not exists class_logs_gym_class_idx on public.class_logs (gym_class_id);
alter table public.notices add column if not exists class_log_id uuid references public.class_logs(id) on delete cascade;

-- ---------- 도우미 ----------
-- 내 역할 (없으면 null). security definer 라 gym_members 정책을 타지 않아 정책 안에서 순환하지 않는다.
create or replace function public.my_gym_role(p_gym uuid)
returns text language sql stable security definer set search_path = '' as $$
  select role from public.gym_members where gym_id = p_gym and user_id = auth.uid();
$$;
revoke execute on function public.my_gym_role(uuid) from public, anon;
grant execute on function public.my_gym_role(uuid) to authenticated;

create or replace function public.gen_gym_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return code;
end $$;

-- ---------- 접근 규칙 ----------
alter table public.gyms enable row level security;
alter table public.gym_members enable row level security;
alter table public.gym_schedules enable row level security;
alter table public.gym_classes enable row level security;
alter table public.gym_class_techniques enable row level security;
alter table public.gym_attendance enable row level security;
alter table public.log_comments enable row level security;

-- gyms: 자기 체육관만 보기(코드 칸은 앱에서 관장에게만 보여 준다 — 표 자체는 관원도 읽히므로 코드는 뷰로 가린다)
create policy "gyms: 자기 체육관 보기" on public.gyms for select to authenticated using (public.my_gym_role(id) is not null);
create policy "gyms: 관장 수정" on public.gyms for update to authenticated using (public.my_gym_role(id) = 'owner') with check (public.my_gym_role(id) = 'owner');
create policy "gyms: 관장 삭제" on public.gyms for delete to authenticated using (public.my_gym_role(id) = 'owner');
-- 코드 칸을 관원에게 안 보이게: 관원 · 코치용 뷰(이름 · 지역만). 관장은 표를 직접 읽는다.
create or replace view public.gyms_public with (security_invoker = true) as
  select id, name, region_si, region_gu, created_at from public.gyms;
grant select on public.gyms_public to authenticated;
-- 관원 · 코치가 gyms 표를 직접 읽으면 코드가 보이므로 칸 권한으로 막는다
revoke select on public.gyms from authenticated;
grant select (id, name, region_si, region_gu, created_by, created_at) on public.gyms to authenticated;
grant update (name, region_si, region_gu) on public.gyms to authenticated;
grant delete on public.gyms to authenticated;

-- gym_members
create policy "gym_members: 같은 체육관 보기" on public.gym_members for select to authenticated using (public.my_gym_role(gym_id) is not null);
create policy "gym_members: 나가기" on public.gym_members for delete to authenticated
  using (user_id = auth.uid() and role <> 'owner');
create policy "gym_members: 관장이 코치 빼기" on public.gym_members for update to authenticated
  using (public.my_gym_role(gym_id) = 'owner' and role = 'coach') with check (role = 'member');

-- gym_schedules
create policy "gym_schedules: 같은 체육관 보기" on public.gym_schedules for select to authenticated using (public.my_gym_role(gym_id) is not null);
create policy "gym_schedules: 관장 · 코치 쓰기" on public.gym_schedules for all to authenticated
  using (public.my_gym_role(gym_id) in ('owner','coach')) with check (public.my_gym_role(gym_id) in ('owner','coach'));

-- gym_classes (7일 전까지 · 오늘(서울)까지)
create policy "gym_classes: 같은 체육관 보기" on public.gym_classes for select to authenticated using (public.my_gym_role(gym_id) is not null);
create policy "gym_classes: 관장 · 코치 추가" on public.gym_classes for insert to authenticated
  with check (public.my_gym_role(gym_id) in ('owner','coach') and posted_by = auth.uid()
    and held_on <= (now() at time zone 'Asia/Seoul')::date and held_on >= (now() at time zone 'Asia/Seoul')::date - 7);
create policy "gym_classes: 관장 · 코치 수정" on public.gym_classes for update to authenticated
  using (public.my_gym_role(gym_id) in ('owner','coach')) with check (public.my_gym_role(gym_id) in ('owner','coach'));
create policy "gym_classes: 관장 · 코치 삭제" on public.gym_classes for delete to authenticated
  using (public.my_gym_role(gym_id) in ('owner','coach'));

-- gym_class_techniques (수업을 거쳐 판정)
create policy "gym_class_techniques: 같은 체육관 보기" on public.gym_class_techniques for select to authenticated
  using (exists (select 1 from public.gym_classes c where c.id = gym_class_id and public.my_gym_role(c.gym_id) is not null));
create policy "gym_class_techniques: 관장 · 코치 쓰기" on public.gym_class_techniques for all to authenticated
  using (exists (select 1 from public.gym_classes c where c.id = gym_class_id and public.my_gym_role(c.gym_id) in ('owner','coach')))
  with check (exists (select 1 from public.gym_classes c where c.id = gym_class_id and public.my_gym_role(c.gym_id) in ('owner','coach')));

-- gym_attendance: 관원은 자기 줄, 관장 · 코치는 체육관 전부. 추가는 함수로만
create policy "gym_attendance: 보기" on public.gym_attendance for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.gym_classes c where c.id = gym_class_id and public.my_gym_role(c.gym_id) in ('owner','coach')));

-- log_comments: 기록 주인은 보기, 관장 · 코치는 자기 체육관 관원 기록에 쓰기 · 내 것 수정 · 삭제
create policy "log_comments: 기록 주인 보기" on public.log_comments for select to authenticated
  using (exists (select 1 from public.class_logs l where l.id = class_log_id and l.user_id = auth.uid()));
create policy "log_comments: 관장 · 코치 보기" on public.log_comments for select to authenticated
  using (public.my_gym_role(gym_id) in ('owner','coach'));
create policy "log_comments: 내 것 수정" on public.log_comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "log_comments: 내 것 삭제" on public.log_comments for delete to authenticated using (author_id = auth.uid());

-- 기존 표는 넓히지 않는다 — 넓히면 관장 본인의 홈 · 기록 화면(RLS = 내 것만을 전제)에 관원 기록이 섞인다.
-- 관원 기록은 아래 gym_member_overview · gym_member_log 함수로만 관장 · 코치에게 내보낸다(D-127).

-- ---------- 함수 ----------
-- 체육관 등록 → 코드 2개 + 내 관장 줄. 돌려주는 것: 체육관 id
create or replace function public.create_gym(p_name text, p_si text, p_gu text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_join text;
  v_coach text;
begin
  if v_me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if (select count(*) from public.gyms where created_by = v_me) >= 5 then raise exception 'too many gyms' using errcode = 'P0003'; end if;
  loop
    v_join := public.gen_gym_code();
    exit when not exists (select 1 from public.gyms where join_code = v_join or coach_code = v_join);
  end loop;
  loop
    v_coach := public.gen_gym_code();
    exit when v_coach <> v_join and not exists (select 1 from public.gyms where join_code = v_coach or coach_code = v_coach);
  end loop;
  insert into public.gyms (name, region_si, region_gu, join_code, coach_code, created_by)
  values (btrim(p_name), nullif(btrim(p_si), ''), nullif(btrim(p_gu), ''), v_join, v_coach, v_me) returning id into v_id;
  insert into public.gym_members (gym_id, user_id, role) values (v_id, v_me, 'owner');
  return v_id;
end $$;
revoke execute on function public.create_gym(text, text, text) from public, anon;
grant execute on function public.create_gym(text, text, text) to authenticated;

-- 코드로 체육관 미리 보기(동의 화면용) — 이름 · 지역 · 어떤 코드인지
create or replace function public.peek_gym(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v public.gyms%rowtype;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into v from public.gyms where join_code = upper(btrim(p_code)) or coach_code = upper(btrim(p_code));
  if not found then return null; end if;
  return jsonb_build_object('id', v.id, 'name', v.name, 'region_si', v.region_si, 'region_gu', v.region_gu,
    'role', case when v.coach_code = upper(btrim(p_code)) then 'coach' else 'member' end,
    'already', public.my_gym_role(v.id));
end $$;
revoke execute on function public.peek_gym(text) from public, anon;
grant execute on function public.peek_gym(text) to authenticated;

-- 들어가기(동의 시각 기록). 관원 코드 → member, 코치 코드 → coach. 이미 있으면 역할을 올리기만(member → coach).
create or replace function public.join_gym(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v public.gyms%rowtype;
  v_role text;
begin
  if v_me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into v from public.gyms where join_code = upper(btrim(p_code)) or coach_code = upper(btrim(p_code));
  if not found then raise exception 'no such code' using errcode = 'P0002'; end if;
  v_role := case when v.coach_code = upper(btrim(p_code)) then 'coach' else 'member' end;
  insert into public.gym_members (gym_id, user_id, role) values (v.id, v_me, v_role)
  on conflict (gym_id, user_id) do update set role = case when public.gym_members.role = 'owner' then 'owner' when excluded.role = 'coach' then 'coach' else public.gym_members.role end;
  return v.id;
end $$;
revoke execute on function public.join_gym(text) from public, anon;
grant execute on function public.join_gym(text) to authenticated;

-- 출석 = 수업 내용을 내 기록으로(날짜 · 기술 · 메모 복사, D-121 가져오기와 같음) + 출석 줄. 두 번이면 전 기록 id.
create or replace function public.attend_class(p_class uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  c public.gym_classes%rowtype;
  v_log uuid;
begin
  if v_me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into c from public.gym_classes where id = p_class;
  if not found or c.status <> 'posted' then raise exception 'no class' using errcode = 'P0002'; end if;
  if public.my_gym_role(c.gym_id) is null then raise exception 'not a member' using errcode = '42501'; end if;
  select class_log_id into v_log from public.gym_attendance where gym_class_id = p_class and user_id = v_me;
  if found then
    if v_log is not null then return v_log; end if;
    -- 출석은 했는데 기록을 지운 경우 — 다시 만들어 연결
  end if;
  insert into public.class_logs (user_id, logged_on, body, terms, ai_status, sparring_rounds, gym_class_id)
  values (v_me, c.held_on, c.body, '[]'::jsonb, 'none', 0, p_class) returning id into v_log;
  insert into public.class_log_techniques (user_id, class_log_id, technique_id, custom_name)
  select v_me, v_log, t.technique_id, t.custom_name from public.gym_class_techniques t where t.gym_class_id = p_class order by t.sort_order;
  insert into public.technique_levels (user_id, technique_id, level)
  select v_me, l.technique_id, 'beginner' from public.class_log_techniques l where l.class_log_id = v_log and l.technique_id is not null
  on conflict (user_id, technique_id) do nothing;
  insert into public.gym_attendance (gym_class_id, user_id, class_log_id) values (p_class, v_me, v_log)
  on conflict (gym_class_id, user_id) do update set class_log_id = excluded.class_log_id;
  return v_log;
end $$;
revoke execute on function public.attend_class(uuid) from public, anon;
grant execute on function public.attend_class(uuid) to authenticated;

-- 체육관 사람들 이름 · 벨트 · 시작 연월(메타에서, 이메일 ✗) — 같은 체육관 사람만. 닉네임이 없으면 이메일 앞부분
create or replace function public.gym_member_names(p_gym uuid)
returns table (user_id uuid, role text, joined_at timestamptz, nick text, belt text, started_on text)
language sql stable security definer set search_path = '' as $$
  select m.user_id, m.role, m.joined_at,
         coalesce(nullif(btrim(u.raw_user_meta_data->>'nick'), ''), split_part(u.email, '@', 1)),
         u.raw_user_meta_data->>'belt', u.raw_user_meta_data->>'started_on'
  from public.gym_members m join auth.users u on u.id = m.user_id
  where m.gym_id = p_gym and public.my_gym_role(p_gym) is not null;
$$;
revoke execute on function public.gym_member_names(uuid) from public, anon;
grant execute on function public.gym_member_names(uuid) to authenticated;

-- 코멘트 + 기록 주인에게 알림. 내가 그 체육관 관장 · 코치이고 기록 주인이 그 체육관 관원일 때만
create or replace function public.comment_log(p_log uuid, p_gym uuid, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v_owner uuid;
  v_on date;
  v_id uuid;
  v_nick text;
begin
  if v_me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if public.my_gym_role(p_gym) not in ('owner','coach') then raise exception 'not coach' using errcode = '42501'; end if;
  select user_id, logged_on into v_owner, v_on from public.class_logs where id = p_log;
  if not found or public.my_gym_role(p_gym) is null or not exists (select 1 from public.gym_members where gym_id = p_gym and user_id = v_owner) then
    raise exception 'not my member' using errcode = '42501';
  end if;
  if char_length(btrim(p_body)) < 1 or char_length(p_body) > 500 then raise exception 'bad body' using errcode = 'P0001'; end if;
  insert into public.log_comments (class_log_id, gym_id, author_id, body) values (p_log, p_gym, v_me, btrim(p_body)) returning id into v_id;
  select coalesce(nullif(btrim(raw_user_meta_data->>'nick'), ''), split_part(email, '@', 1)) into v_nick from auth.users where id = v_me;
  insert into public.notices (user_id, message, class_log_id)
  values (v_owner, left(v_nick || ' 님이 ' || to_char(v_on, 'FMMM월 FMDD일') || ' 기록에 코멘트를 남겼어요', 200), p_log);
  return v_id;
end $$;
revoke execute on function public.comment_log(uuid, uuid, text) from public, anon;
grant execute on function public.comment_log(uuid, uuid, text) to authenticated;

-- 코드 다시 만들기(관장만). which = 'join' | 'coach'
create or replace function public.regen_gym_code(p_gym uuid, p_which text)
returns text language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  if public.my_gym_role(p_gym) <> 'owner' then raise exception 'not owner' using errcode = '42501'; end if;
  loop
    v := public.gen_gym_code();
    exit when not exists (select 1 from public.gyms where join_code = v or coach_code = v);
  end loop;
  if p_which = 'coach' then update public.gyms set coach_code = v where id = p_gym;
  else update public.gyms set join_code = v where id = p_gym; end if;
  return v;
end $$;
revoke execute on function public.regen_gym_code(uuid, text) from public, anon;
grant execute on function public.regen_gym_code(uuid, text) to authenticated;

-- 관장 코드 보기(관장만) — gyms 표의 코드 칸은 칸 권한으로 막혀 있어서 함수로
create or replace function public.gym_codes(p_gym uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when public.my_gym_role(p_gym) = 'owner'
    then jsonb_build_object('join_code', join_code, 'coach_code', coach_code) end
  from public.gyms where id = p_gym;
$$;
revoke execute on function public.gym_codes(uuid) from public, anon;
grant execute on function public.gym_codes(uuid) to authenticated;

-- 관장 넘기기(관장만, 대상은 같은 체육관 코치 · 관원)
create or replace function public.transfer_gym_owner(p_gym uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.my_gym_role(p_gym) <> 'owner' then raise exception 'not owner' using errcode = '42501'; end if;
  if not exists (select 1 from public.gym_members where gym_id = p_gym and user_id = p_user) then raise exception 'not member' using errcode = 'P0002'; end if;
  update public.gym_members set role = 'coach' where gym_id = p_gym and user_id = auth.uid();
  update public.gym_members set role = 'owner' where gym_id = p_gym and user_id = p_user;
  update public.gyms set created_by = p_user where id = p_gym;
end $$;
revoke execute on function public.transfer_gym_owner(uuid, uuid) from public, anon;
grant execute on function public.transfer_gym_owner(uuid, uuid) to authenticated;

-- 관원 한 명 훑어보기(관장 · 코치만, 같은 체육관 관원) — 숙련도 · 기술별 기록 횟수 · 최근 기록 20개(메모 포함, D-127) · 이번 달 숫자
create or replace function public.gym_member_overview(p_gym uuid, p_user uuid, p_before date default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_levels jsonb; v_counts jsonb; v_logs jsonb; v_month jsonb;
  v_month_start date := date_trunc('month', (now() at time zone 'Asia/Seoul'))::date;
begin
  if public.my_gym_role(p_gym) not in ('owner','coach') then raise exception 'not coach' using errcode = '42501'; end if;
  if not exists (select 1 from public.gym_members where gym_id = p_gym and user_id = p_user) then raise exception 'not member' using errcode = 'P0002'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('technique_id', technique_id, 'level', level)), '[]'::jsonb) into v_levels
    from public.technique_levels where user_id = p_user;
  select coalesce(jsonb_agg(jsonb_build_object('technique_id', technique_id, 'n', n)), '[]'::jsonb) into v_counts
    from (select technique_id, count(*) n from public.class_log_techniques where user_id = p_user and technique_id is not null group by 1) x;
  select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) into v_logs from (
    select l.id, l.logged_on, l.body, l.sparring_rounds, l.gym_class_id,
      (select coalesce(jsonb_agg(coalesce(t.name_ko, c.custom_name) order by c.created_at), '[]'::jsonb)
         from public.class_log_techniques c left join public.techniques t on t.id = c.technique_id where c.class_log_id = l.id) as techniques,
      (select count(*) from public.log_comments k where k.class_log_id = l.id) as comments
    from public.class_logs l
    where l.user_id = p_user and (p_before is null or l.logged_on < p_before)
    order by l.logged_on desc, l.created_at desc limit 20) r;
  select jsonb_build_object(
    'attendance', (select count(*) from public.gym_attendance a join public.gym_classes c on c.id = a.gym_class_id where a.user_id = p_user and c.gym_id = p_gym and c.held_on >= v_month_start),
    'logs', (select count(*) from public.class_logs where user_id = p_user and logged_on >= v_month_start),
    'sparring', (select coalesce(sum(sparring_rounds), 0) from public.class_logs where user_id = p_user and logged_on >= v_month_start),
    'last_attended', (select max(c.held_on) from public.gym_attendance a join public.gym_classes c on c.id = a.gym_class_id where a.user_id = p_user and c.gym_id = p_gym)
  ) into v_month;
  return jsonb_build_object('levels', v_levels, 'counts', v_counts, 'logs', v_logs, 'month', v_month);
end $$;
revoke execute on function public.gym_member_overview(uuid, uuid, date) from public, anon;
grant execute on function public.gym_member_overview(uuid, uuid, date) to authenticated;

-- 관원 기록 하나(관장 · 코치만) — 기술 · 메모 · 스파링 · 코멘트
create or replace function public.gym_member_log(p_gym uuid, p_log uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare l public.class_logs%rowtype; v_techs jsonb; v_comments jsonb; v_nick text;
begin
  if public.my_gym_role(p_gym) not in ('owner','coach') then raise exception 'not coach' using errcode = '42501'; end if;
  select * into l from public.class_logs where id = p_log;
  if not found or not exists (select 1 from public.gym_members where gym_id = p_gym and user_id = l.user_id) then return null; end if;
  select coalesce(nullif(btrim(raw_user_meta_data->>'nick'), ''), split_part(email, '@', 1)) into v_nick from auth.users where id = l.user_id;
  select coalesce(jsonb_agg(jsonb_build_object('slug', t.slug, 'name_ko', coalesce(t.name_ko, c.custom_name), 'name_en', t.name_en,
           'position', p.name_ko, 'position_slug', p.slug, 'public', t.owner_id is null and t.id is not null) order by c.created_at), '[]'::jsonb) into v_techs
    from public.class_log_techniques c left join public.techniques t on t.id = c.technique_id left join public.positions p on p.id = t.position_id
    where c.class_log_id = p_log;
  select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'body', k.body, 'created_at', k.created_at, 'author_id', k.author_id, 'mine', k.author_id = auth.uid(),
           'author', coalesce(nullif(btrim(u.raw_user_meta_data->>'nick'), ''), split_part(u.email, '@', 1))) order by k.created_at), '[]'::jsonb) into v_comments
    from public.log_comments k join auth.users u on u.id = k.author_id where k.class_log_id = p_log and k.gym_id = p_gym;
  return jsonb_build_object('id', l.id, 'user_id', l.user_id, 'nick', v_nick, 'logged_on', l.logged_on, 'body', l.body, 'sparring_rounds', l.sparring_rounds,
    'techniques', v_techs, 'comments', v_comments);
end $$;
revoke execute on function public.gym_member_log(uuid, uuid) from public, anon;
grant execute on function public.gym_member_log(uuid, uuid) to authenticated;

-- 관원이 내 기록에 달린 코멘트 보기(쓴 사람 닉네임 포함)
create or replace function public.my_log_comments(p_log uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'body', k.body, 'created_at', k.created_at, 'gym', g.name,
           'author', coalesce(nullif(btrim(u.raw_user_meta_data->>'nick'), ''), split_part(u.email, '@', 1)),
           'role', coalesce((select role from public.gym_members m where m.gym_id = k.gym_id and m.user_id = k.author_id), 'coach')) order by k.created_at), '[]'::jsonb)
  from public.log_comments k join auth.users u on u.id = k.author_id join public.gyms g on g.id = k.gym_id
  where k.class_log_id = p_log and exists (select 1 from public.class_logs l where l.id = p_log and l.user_id = auth.uid());
$$;
revoke execute on function public.my_log_comments(uuid) from public, anon;
grant execute on function public.my_log_comments(uuid) to authenticated;
