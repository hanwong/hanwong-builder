-- D-124: 수업 링크에 메모도 — 공유의 핵심은 수업 메모. shared_log 가 body 를 돌려주고, 가져올 때 메모도 복사한다. 스파링 횟수는 그대로 안 보냄.
create or replace function public.shared_log(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_log public.class_logs%rowtype;
  v_nick text;
  v_techs jsonb;
  v_customs jsonb;
  v_mine uuid;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into v_log from public.class_logs where id = p_id and shared_at is not null;
  if not found then return null; end if;
  select nullif(btrim(raw_user_meta_data->>'nick'), '') into v_nick from auth.users where id = v_log.user_id;
  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', t.slug, 'name_ko', t.name_ko, 'name_en', t.name_en,
           'position', p.name_ko, 'position_slug', p.slug, 'public', t.owner_id is null) order by l.created_at), '[]'::jsonb)
    into v_techs
  from public.class_log_techniques l
  join public.techniques t on t.id = l.technique_id
  left join public.positions p on p.id = t.position_id
  where l.class_log_id = p_id;
  select coalesce(jsonb_agg(l.custom_name order by l.created_at), '[]'::jsonb) into v_customs
  from public.class_log_techniques l where l.class_log_id = p_id and l.custom_name is not null;
  select id into v_mine from public.class_logs where user_id = auth.uid() and imported_from = p_id;
  return jsonb_build_object(
    'logged_on', v_log.logged_on, 'body', v_log.body, 'nick', v_nick, 'owner', v_log.user_id = auth.uid(),
    'techniques', v_techs, 'custom_names', v_customs, 'imported_id', v_mine);
end $$;

create or replace function public.import_shared_log(p_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_log public.class_logs%rowtype;
  v_me uuid := auth.uid();
  v_new uuid;
begin
  if v_me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into v_log from public.class_logs where id = p_id and shared_at is not null;
  if not found then raise exception 'not shared' using errcode = 'P0002'; end if;
  if v_log.user_id = v_me then raise exception 'own log' using errcode = 'P0001'; end if;
  select id into v_new from public.class_logs where user_id = v_me and imported_from = p_id;
  if v_new is not null then return v_new; end if;
  insert into public.class_logs (user_id, logged_on, body, terms, ai_status, sparring_rounds, imported_from)
  values (v_me, v_log.logged_on, v_log.body, '[]'::jsonb, 'none', 0, p_id) returning id into v_new;
  insert into public.class_log_techniques (user_id, class_log_id, technique_id, custom_name)
  select v_me, v_new,
         case when t.owner_id is null then l.technique_id end,
         case when l.technique_id is null then l.custom_name when t.owner_id is not null then t.name_ko end
  from public.class_log_techniques l
  left join public.techniques t on t.id = l.technique_id
  where l.class_log_id = p_id;
  insert into public.technique_levels (user_id, technique_id, level)
  select v_me, l.technique_id, 'beginner' from public.class_log_techniques l
  where l.class_log_id = v_new and l.technique_id is not null
  on conflict (user_id, technique_id) do nothing;
  return v_new;
end $$;
