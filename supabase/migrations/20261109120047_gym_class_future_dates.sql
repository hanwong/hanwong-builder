-- D-134 수업 내용을 오늘 이후 어느 날짜에도 등록(미리 올리기). 지난 수업은 지금처럼 7일 전까지.
-- 미리 올린 수업에 출석하면 미래 날짜 기록이 생기므로, 출석은 수업 날짜(서울)부터만 받는다.
drop policy if exists "gym_classes: 관장 · 코치 추가" on public.gym_classes;
create policy "gym_classes: 관장 · 코치 추가" on public.gym_classes for insert to authenticated
  with check (public.my_gym_role(gym_id) in ('owner','coach') and posted_by = auth.uid()
    and held_on >= (now() at time zone 'Asia/Seoul')::date - 7);

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
  -- D-134: 앞날짜 수업은 미리 올릴 수 있지만 출석은 그날부터
  if c.held_on > (now() at time zone 'Asia/Seoul')::date then raise exception 'class not yet' using errcode = '22023'; end if;
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
