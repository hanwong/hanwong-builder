-- D-143 수업 내용이 아직 없어도 출석. 그날 수업 줄을 'open'(출석만 열림, 내용 없음)으로 만들고 출석만 남긴다(기록은 안 생김 — 복사할 내용이 없어서).
-- 관장 · 코치가 나중에 내용을 올리면 같은 줄이 'posted' 가 된다(앱 postClass). 출석률에는 open · posted 모두 수업으로 센다.

-- 상태에 'open' 더하기 — 이름이 자동으로 붙은 check 를 찾아 바꾼다
do $$
declare v_name text;
begin
  select con.conname into v_name
  from pg_constraint con join pg_class rel on rel.oid = con.conrelid join pg_namespace n on n.oid = rel.relnamespace
  where n.nspname = 'public' and rel.relname = 'gym_classes' and con.contype = 'c' and pg_get_constraintdef(con.oid) like '%status%';
  if v_name is not null then execute format('alter table public.gym_classes drop constraint %I', v_name); end if;
end $$;
alter table public.gym_classes add constraint gym_classes_status_check check (status in ('posted','canceled','open'));

-- 오늘(서울) 매주 수업 칸에 출석. 그 수업에 내용이 있으면 출석 + 저장(attend_class)과 같다.
-- 돌려주는 값: 수업 id
create or replace function public.attend_slot(p_gym uuid, p_schedule uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  s public.gym_schedules%rowtype;
  c public.gym_classes%rowtype;
  v_owner uuid;
begin
  if v_me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if public.my_gym_role(p_gym) is null then raise exception 'not a member' using errcode = '42501'; end if;
  select * into s from public.gym_schedules where id = p_schedule and gym_id = p_gym;
  if not found or s.weekday <> extract(dow from v_today)::int or s.active_from > v_today or (s.active_until is not null and s.active_until < v_today) then
    raise exception 'no class today' using errcode = 'P0002';
  end if;
  select * into c from public.gym_classes where gym_id = p_gym and schedule_id = p_schedule and held_on = v_today;
  if found then
    if c.status = 'canceled' then raise exception 'canceled' using errcode = 'P0002'; end if;
    if c.status = 'posted' then perform public.attend_class(c.id); return c.id; end if;
  else
    -- 내용 없는 줄 — 올린 사람 칸은 체육관 관장으로(관원이 올린 것처럼 보이지 않게)
    select user_id into v_owner from public.gym_members where gym_id = p_gym and role = 'owner' order by joined_at limit 1;
    insert into public.gym_classes (gym_id, schedule_id, held_on, name, starts_at, status, body, posted_by)
    values (p_gym, p_schedule, v_today, s.name, s.starts_at, 'open', '', coalesce(v_owner, v_me))
    on conflict do nothing
    returning * into c;
    if c.id is null then
      select * into c from public.gym_classes where gym_id = p_gym and schedule_id = p_schedule and held_on = v_today;
    end if;
  end if;
  insert into public.gym_attendance (gym_class_id, user_id, class_log_id) values (c.id, v_me, null)
  on conflict (gym_class_id, user_id) do nothing;
  return c.id;
end $$;
revoke execute on function public.attend_slot(uuid, uuid) from public, anon;
grant execute on function public.attend_slot(uuid, uuid) to authenticated;
