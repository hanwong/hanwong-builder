-- D-115 (M2-21): 시험 홈 '자라는 지도' 그림용 — 최근 14일 날마다 지도에 들어간 공용 기술 수(서울 날짜, 오래된 날부터)와
-- 최근 기술의 포지션(그림). 여전히 숫자 · 공용 기술 이름만 내보낸다.
create or replace function public.map_growth()
returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'total', (select count(*) from public.techniques where owner_id is null),
    'added_7d', (select count(*) from public.techniques where owner_id is null and created_at > now() - interval '7 days'),
    'from_questions', (select count(*) from public.technique_drafts where status = 'approved' and note like '%질문%'),
    'daily', (
      select json_agg(coalesce(c.n, 0) order by d.day)
      from generate_series(
        (now() at time zone 'Asia/Seoul')::date - 13, (now() at time zone 'Asia/Seoul')::date, interval '1 day'
      ) as d(day)
      left join (
        select (created_at at time zone 'Asia/Seoul')::date as day, count(*) as n
        from public.techniques where owner_id is null and created_at > now() - interval '15 days' group by 1
      ) c on c.day = d.day::date
    ),
    'last_run', (
      select json_build_object('run_on', r.run_on, 'questions', coalesce(r.questions, 0), 'drafted', coalesce(cardinality(r.drafted), 0))
      from public.map_agent_runs r where r.status = 'done' order by r.run_on desc limit 1
    ),
    'recent', (
      select coalesce(json_agg(json_build_object('slug', t.slug, 'name', t.name_ko, 'position', p.slug) order by t.created_at desc), '[]'::json)
      from (select slug, name_ko, position_id, created_at from public.techniques where owner_id is null order by created_at desc limit 8) t
      left join public.positions p on p.id = t.position_id
    )
  )
$$;
revoke all on function public.map_growth() from public, anon;
grant execute on function public.map_growth() to authenticated;
