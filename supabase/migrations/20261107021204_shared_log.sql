-- D-123: 수업 링크로 기록 가져오기 — 공유를 켠 기록만 주소로 열린다(로그인한 사람). 날짜 · 기술 · 올린 사람 닉네임만, 메모 · 스파링은 안 보인다.
alter table public.class_logs add column shared_at timestamptz;                                                  -- 공유 켠 시각. null 이면 꺼짐(기본)
alter table public.class_logs add column imported_from uuid references public.class_logs(id) on delete set null; -- 어느 공유 기록에서 가져왔나
create unique index class_logs_import_once_uidx on public.class_logs (user_id, imported_from) where imported_from is not null; -- 같은 링크는 한 사람이 한 번만

-- 공유한 기록 보기 — 로그인한 사람 누구나(주소를 아는 사람). 공유가 꺼져 있으면 null.
-- 돌려주는 것: 수업 날짜 · 올린 사람 닉네임 · 기술(이름 · 포지션 · 공용인지) · 직접 적은 기술 이름 · 내가 올린 것인지 · 내가 이미 가져온 기록 id.
-- 표를 넓게 여는 대신 함수로만 내보낸다(메모 · 스파링 · 이메일은 함수 밖으로 안 나감).
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
    'logged_on', v_log.logged_on, 'nick', v_nick, 'owner', v_log.user_id = auth.uid(),
    'techniques', v_techs, 'custom_names', v_customs, 'imported_id', v_mine);
end $$;
revoke execute on function public.shared_log(uuid) from public, anon;
grant execute on function public.shared_log(uuid) to authenticated;

-- 내 기록으로 가져오기 — 날짜 · 기술만 복사한 새 기록(메모 비움 · 스파링 0). 올린 사람의 '나만 보기' 기술은 이름만 복사.
-- 같은 링크를 두 번 누르면 전에 만든 기록 id 를 돌려준다. 숙련도는 없는 기술만 '처음 배움'으로.
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
  values (v_me, v_log.logged_on, '', '[]'::jsonb, 'none', 0, p_id) returning id into v_new;
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
revoke execute on function public.import_shared_log(uuid) from public, anon;
grant execute on function public.import_shared_log(uuid) to authenticated;
