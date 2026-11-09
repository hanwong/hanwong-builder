-- D-130 관원 본명 — 체육관에 들어올 때 본명을 적는다. 그 체육관 관장 · 코치만 본다(관원끼리 ✗).
-- 본명은 체육관마다 따로(gym_members 줄에). 표에서 바로 읽을 수 없게 칸 권한을 막고, 아래 함수로만 내보낸다.

alter table public.gym_members add column if not exists real_name text
  check (real_name is null or char_length(btrim(real_name)) between 1 and 20);

-- 같은 체육관 사람이 gym_members 줄을 읽을 수 있으므로(RLS) 본명 칸은 칸 권한으로 숨긴다.
revoke select on public.gym_members from authenticated, anon;
grant select (id, gym_id, user_id, role, consented_at, joined_at) on public.gym_members to authenticated;
-- 관장이 코치 빼기(update 정책)로 남의 본명을 고치지 못하게 — 역할 칸만 고칠 수 있다.
revoke update on public.gym_members from authenticated, anon;
grant update (role) on public.gym_members to authenticated;

-- 들어가기: 본명 필수. 이미 있으면 역할 올리기 + 본명 바꾸기.
drop function if exists public.join_gym(text);
create or replace function public.join_gym(p_code text, p_real_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v public.gyms%rowtype;
  v_role text;
  v_name text := btrim(coalesce(p_real_name, ''));
begin
  if v_me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if char_length(v_name) not between 1 and 20 then raise exception 'real name required' using errcode = '22023'; end if;
  select * into v from public.gyms where join_code = upper(btrim(p_code)) or coach_code = upper(btrim(p_code));
  if not found then raise exception 'no such code' using errcode = 'P0002'; end if;
  v_role := case when v.coach_code = upper(btrim(p_code)) then 'coach' else 'member' end;
  insert into public.gym_members (gym_id, user_id, role, real_name) values (v.id, v_me, v_role, v_name)
  on conflict (gym_id, user_id) do update set
    role = case when public.gym_members.role = 'owner' then 'owner' when excluded.role = 'coach' then 'coach' else public.gym_members.role end,
    real_name = excluded.real_name;
  return v.id;
end $$;
revoke execute on function public.join_gym(text, text) from public, anon;
grant execute on function public.join_gym(text, text) to authenticated;

-- 이미 들어와 있는 사람이 본명을 적거나 고친다(내 줄만).
create or replace function public.set_gym_real_name(p_gym uuid, p_real_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_name text := btrim(coalesce(p_real_name, ''));
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if char_length(v_name) not between 1 and 20 then raise exception 'real name required' using errcode = '22023'; end if;
  update public.gym_members set real_name = v_name where gym_id = p_gym and user_id = auth.uid();
  if not found then raise exception 'not a member' using errcode = '42501'; end if;
end $$;
revoke execute on function public.set_gym_real_name(uuid, text) from public, anon;
grant execute on function public.set_gym_real_name(uuid, text) to authenticated;

-- 내 체육관별 본명(홈 카드에서 "본명 입력" 줄을 띄울지 판단).
create or replace function public.my_gym_real_names()
returns table (gym_id uuid, real_name text)
language sql stable security definer set search_path = '' as $$
  select m.gym_id, m.real_name from public.gym_members m where m.user_id = auth.uid();
$$;
revoke execute on function public.my_gym_real_names() from public, anon;
grant execute on function public.my_gym_real_names() to authenticated;

-- 체육관 사람 이름: 본명은 부르는 사람이 그 체육관 관장 · 코치일 때만, 아니면 null.
drop function if exists public.gym_member_names(uuid);
create or replace function public.gym_member_names(p_gym uuid)
returns table (user_id uuid, role text, joined_at timestamptz, nick text, belt text, started_on text, real_name text)
language sql stable security definer set search_path = '' as $$
  select m.user_id, m.role, m.joined_at,
         coalesce(nullif(btrim(u.raw_user_meta_data->>'nick'), ''), split_part(u.email, '@', 1)),
         u.raw_user_meta_data->>'belt', u.raw_user_meta_data->>'started_on',
         case when public.my_gym_role(p_gym) in ('owner', 'coach') then m.real_name end
  from public.gym_members m join auth.users u on u.id = m.user_id
  where m.gym_id = p_gym and public.my_gym_role(p_gym) is not null;
$$;
revoke execute on function public.gym_member_names(uuid) from public, anon;
grant execute on function public.gym_member_names(uuid) to authenticated;
