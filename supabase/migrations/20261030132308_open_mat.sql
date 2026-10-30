-- 온라인 오픈매트 (D-88). 매트에 들어온 사람은 무작위 별명 · 띠 색으로만 보인다.
-- ① 별명 · 띠: open_mat_me() — 로그인했으면 그 사람의 '오늘 별명'(하루마다 바뀜) + 내 벨트, 아니면 무작위 별명 + 흰 띠
-- ② 기록 알림: open_mat_announce(기록 id) — 내 기록이면 별명 + 배운 기술 이름만 open_mat_events 에 남긴다(사용자 id · 메모 없음).
--    매트 화면은 이 표의 새 줄을 실시간으로 받는다. 하루 지난 줄은 넣을 때 지운다.

create table public.open_mat_events (
  id bigint generated always as identity primary key,
  nickname text not null,
  belt text not null,
  technique_names text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.open_mat_events enable row level security;
-- 누구나 최근 알림만 본다. 쓰기는 아래 함수로만(표에 직접 쓰는 규칙 없음)
create policy "open_mat_events: 누구나 하루치 보기" on public.open_mat_events
  for select using (created_at > now() - interval '1 day');
create index open_mat_events_created_at on public.open_mat_events (created_at desc);
alter publication supabase_realtime add table public.open_mat_events;

-- 별명 낱말(주짓수 분위기). 순서를 바꾸면 그날 별명이 바뀌니 뒤에만 더한다
create or replace function public.open_mat_nickname(seed text)
returns text language sql immutable set search_path = '' as $$
  select (array['조용한','부지런한','유연한','단단한','느긋한','재빠른','끈질긴','다정한','차분한','씩씩한','묵묵한','가벼운','꾸준한','날렵한','든든한','상냥한'])
           [1 + (('x' || substr(md5(seed), 1, 8))::bit(32)::bigint % 16)::int]
      || ' ' ||
         (array['새우','거북','문어','고양이','수달','곰','펭귄','다람쥐','두더지','판다','여우','너구리','물개','고래','참새','코알라'])
           [1 + (('x' || substr(md5(seed), 9, 8))::bit(32)::bigint % 16)::int];
$$;

create or replace function public.open_mat_me()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  b text := coalesce(auth.jwt() -> 'user_metadata' ->> 'belt', 'white');
begin
  if uid is null then
    return jsonb_build_object('nickname', public.open_mat_nickname(gen_random_uuid()::text), 'belt', 'white', 'member', false, 'announce', false);
  end if;
  if b not in ('white','blue','purple','brown','black','grey','yellow','orange','green') then b := 'white'; end if;
  return jsonb_build_object(
    'nickname', public.open_mat_nickname(uid::text || ':' || (now() at time zone 'Asia/Seoul')::date::text),
    'belt', b,
    'member', true,
    'announce', coalesce((auth.jwt() -> 'user_metadata' ->> 'open_mat_quiet')::boolean, false) = false
  );
end $$;

create or replace function public.open_mat_announce(p_log uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  me jsonb;
  names text[];
begin
  if uid is null then return; end if;
  me := public.open_mat_me();
  if not (me ->> 'announce')::boolean then return; end if;
  -- 내 기록인지 확인하고, 연결된 기술 이름만(목록 밖 이름 · 메모는 내보내지 않음)
  select coalesce(array_agg(t.name_ko order by t.name_ko), '{}') into names
  from public.class_logs l
  join public.class_log_techniques c on c.class_log_id = l.id
  join public.techniques t on t.id = c.technique_id
  where l.id = p_log and l.user_id = uid;
  if not exists (select 1 from public.class_logs where id = p_log and user_id = uid) then return; end if;
  delete from public.open_mat_events where created_at < now() - interval '1 day';
  insert into public.open_mat_events (nickname, belt, technique_names)
  values (me ->> 'nickname', me ->> 'belt', names[1:3]);
end $$;

revoke execute on function public.open_mat_me() from public;
grant execute on function public.open_mat_me() to anon, authenticated;
revoke execute on function public.open_mat_announce(uuid) from public, anon;
grant execute on function public.open_mat_announce(uuid) to authenticated;
