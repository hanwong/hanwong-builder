-- D-87: 운영 초안(technique_drafts)도 기술 지도 칸 7개(D-81)를 받아 두고, 승인할 때 기술로 옮긴다.
-- 종류 칸 이름은 초안 종류(kind = new · alias · unclear)와 겹쳐 tech_kind 로 둔다. 쓰기 규칙(RLS)은 그대로.
alter table public.technique_drafts
  add column if not exists tech_kind text check (tech_kind in ('takedown','guard_pull','sweep','pass','submission','escape','back_take','transition','control','defense')),
  add column if not exists role text check (role in ('top','bottom','standing','both')),
  add column if not exists ends_at text[] not null default '{}',
  add column if not exists key_points text[] not null default '{}',
  add column if not exists mistakes text[] not null default '{}',
  add column if not exists if_blocked text[] not null default '{}',
  add column if not exists defense text[] not null default '{}';

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

  if d.kind = 'alias' then
    if d.alias_of is null then raise exception 'alias target missing'; end if;
    tid := d.alias_of;
    update public.techniques
       set aliases = case when public.name_key(d.custom_name) in (public.name_key(name_ko), public.name_key(name_en))
                             or exists (select 1 from unnest(aliases) a where public.name_key(a) = public.name_key(d.custom_name))
                        then aliases else array_append(aliases, d.custom_name) end
     where id = tid
     returning name_ko into tname;
    if not found then raise exception 'alias target not found'; end if;
  elsif d.kind = 'new' then
    if d.position_id is null or coalesce(d.slug, '') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       or coalesce(btrim(d.name_ko), '') = '' or coalesce(btrim(d.name_en), '') = ''
       or coalesce(array_length(d.steps, 1), 0) not between 3 and 5 then
      raise exception 'draft incomplete';
    end if;
    insert into public.techniques (position_id, slug, name_ko, name_en, aliases, steps, is_reviewed, source, sort_order,
                                   kind, role, ends_at, key_points, mistakes, if_blocked, defense)
    values (d.position_id, d.slug, btrim(d.name_ko), btrim(d.name_en),
            case when public.name_key(d.custom_name) in (public.name_key(d.name_ko), public.name_key(d.name_en))
                   or exists (select 1 from unnest(d.aliases) a where public.name_key(a) = public.name_key(d.custom_name))
                 then d.aliases else array_append(d.aliases, d.custom_name) end,
            d.steps, true, '운영자 승인(앱 초안, D-47)',
            coalesce((select max(sort_order) from public.techniques where position_id = d.position_id), 0) + 1,
            d.tech_kind, d.role, d.ends_at, d.key_points, d.mistakes, d.if_blocked, d.defense)
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
  insert into public.notices (user_id, message, technique_id)
    select u, left('‘' || d.custom_name || '’ 이(가) 기술 목록에 추가됐어요 — ' || tname, 200), tid from unnest(users) as u;

  update public.technique_drafts set status = 'approved', technique_id = tid, decided_at = now() where id = d.id;
  return jsonb_build_object('technique_id', tid, 'logs', n_logs, 'users', n_users);
end $$;
revoke execute on function public.approve_technique_draft(uuid, date) from public, anon;
grant execute on function public.approve_technique_draft(uuid, date) to authenticated;
