-- D-139 수업 내용을 "내 기록에 저장"만(출석 없이) · "출석 + 저장".
-- 공통: 그 수업으로 만든 내 기록이 있으면 그것을, 없으면 새로 만든다(날짜 · 기술 · 메모 복사, 숙련도 첫 칸).
-- 저장만 한 뒤 출석하면 같은 기록에 출석만 붙는다(기록이 두 개 생기지 않게).

create or replace function public.class_log_for(p_class uuid)
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
  -- D-134: 앞날짜 수업은 그날부터
  if c.held_on > (now() at time zone 'Asia/Seoul')::date then raise exception 'class not yet' using errcode = '22023'; end if;
  select id into v_log from public.class_logs where user_id = v_me and gym_class_id = p_class order by created_at limit 1;
  if found then return v_log; end if;
  insert into public.class_logs (user_id, logged_on, body, terms, ai_status, sparring_rounds, gym_class_id)
  values (v_me, c.held_on, c.body, '[]'::jsonb, 'none', 0, p_class) returning id into v_log;
  insert into public.class_log_techniques (user_id, class_log_id, technique_id, custom_name)
  select v_me, v_log, t.technique_id, t.custom_name from public.gym_class_techniques t where t.gym_class_id = p_class order by t.sort_order;
  insert into public.technique_levels (user_id, technique_id, level)
  select v_me, l.technique_id, 'beginner' from public.class_log_techniques l where l.class_log_id = v_log and l.technique_id is not null
  on conflict (user_id, technique_id) do nothing;
  return v_log;
end $$;
-- 화면에서 직접 부르지 않는다(아래 두 함수만)
revoke execute on function public.class_log_for(uuid) from public, anon, authenticated;

-- 내 기록에 저장만 — 출석 줄은 만들지 않는다(관장 화면 출석 · 출석률에 안 잡힘)
create or replace function public.save_class_log(p_class uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  return public.class_log_for(p_class);
end $$;
revoke execute on function public.save_class_log(uuid) from public, anon;
grant execute on function public.save_class_log(uuid) to authenticated;

-- 출석 + 저장
create or replace function public.attend_class(p_class uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := auth.uid();
  v_log uuid;
begin
  select class_log_id into v_log from public.gym_attendance where gym_class_id = p_class and user_id = v_me;
  if found and v_log is not null then return v_log; end if;
  v_log := public.class_log_for(p_class); -- 권한 · 날짜 확인도 여기서
  insert into public.gym_attendance (gym_class_id, user_id, class_log_id) values (p_class, v_me, v_log)
  on conflict (gym_class_id, user_id) do update set class_log_id = excluded.class_log_id;
  return v_log;
end $$;
revoke execute on function public.attend_class(uuid) from public, anon;
grant execute on function public.attend_class(uuid) to authenticated;
