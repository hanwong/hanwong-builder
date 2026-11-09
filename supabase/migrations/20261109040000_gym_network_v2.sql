-- D-128: 체육관 소속 네트워크(국내 주짓수 네트워크 목록에서 고름, 없으면 없음). 선택 칸. 관장이 등록 · 설정에서 고르고 이름 옆에 보인다.
alter table public.gyms add column if not exists network text check (network is null or char_length(btrim(network)) between 1 and 30);
grant select (network) on public.gyms to authenticated;
grant update (network) on public.gyms to authenticated;
drop view if exists public.gyms_public; -- 칸을 가운데 더하므로 새로 만든다
create view public.gyms_public with (security_invoker = true) as
  select id, name, network, region_si, region_gu, created_at from public.gyms;
grant select on public.gyms_public to authenticated;

drop function if exists public.create_gym(text, text, text);
create or replace function public.create_gym(p_name text, p_si text, p_gu text, p_network text default null)
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
  insert into public.gyms (name, region_si, region_gu, network, join_code, coach_code, created_by)
  values (btrim(p_name), nullif(btrim(p_si), ''), nullif(btrim(p_gu), ''), nullif(btrim(p_network), ''), v_join, v_coach, v_me) returning id into v_id;
  insert into public.gym_members (gym_id, user_id, role) values (v_id, v_me, 'owner');
  return v_id;
end $$;
revoke execute on function public.create_gym(text, text, text, text) from public, anon;
grant execute on function public.create_gym(text, text, text, text) to authenticated;

-- 코드 미리 보기에도 네트워크
create or replace function public.peek_gym(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v public.gyms%rowtype;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into v from public.gyms where join_code = upper(btrim(p_code)) or coach_code = upper(btrim(p_code));
  if not found then return null; end if;
  return jsonb_build_object('id', v.id, 'name', v.name, 'network', v.network, 'region_si', v.region_si, 'region_gu', v.region_gu,
    'role', case when v.coach_code = upper(btrim(p_code)) then 'coach' else 'member' end,
    'already', public.my_gym_role(v.id));
end $$;
