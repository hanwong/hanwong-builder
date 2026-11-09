-- D-144 출석은 수업 시작 1시간 전부터(서울). "내 기록에 저장"(save_class_log)은 출석이 아니라서 그대로.
-- 출석 + 저장(attend_class)과 내용 없는 수업 출석(attend_slot) 둘 다 막는다.

create or replace function public.attend_class(p_class uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v_log uuid;
  c public.gym_classes%rowtype;
begin
  select class_log_id into v_log from public.gym_attendance where gym_class_id = p_class and user_id = v_me;
  if found and v_log is not null then return v_log; end if;
  select * into c from public.gym_classes where id = p_class;
  -- D-144: 수업 시작 1시간 전부터(이미 출석한 사람이 기록만 붙이는 경우는 위에서 빠지지 않으니 여기서도 출석 줄이 있으면 통과)
  if found and not exists (select 1 from public.gym_attendance where gym_class_id = p_class and user_id = v_me)
     and (now() at time zone 'Asia/Seoul') < (c.held_on + c.starts_at) - interval '1 hour' then
    raise exception 'too early' using errcode = '22023';
  end if;
  v_log := public.class_log_for(p_class); -- 권한 · 날짜 확인도 여기서
  insert into public.gym_attendance (gym_class_id, user_id, class_log_id) values (p_class, v_me, v_log)
  on conflict (gym_class_id, user_id) do update set class_log_id = excluded.class_log_id;
  return v_log;
end $$;
revoke execute on function public.attend_class(uuid) from public, anon;
grant execute on function public.attend_class(uuid) to authenticated;

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
  -- D-144: 수업 시작 1시간 전부터
  if (now() at time zone 'Asia/Seoul') < (v_today + s.starts_at) - interval '1 hour' then
    raise exception 'too early' using errcode = '22023';
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
