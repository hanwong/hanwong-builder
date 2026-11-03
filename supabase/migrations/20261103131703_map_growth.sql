-- D-115 (M2-21): 시험 홈 '지도가 자라는 중' 카드. 운영자만 보는 표(map_agent_runs · technique_drafts)에서
-- 숫자와 공용 기술 이름만 꺼내 로그인한 사용자에게 보여 준다. 질문 글 · 초안 내용 · 누가 물었는지는 내보내지 않는다.
create or replace function public.map_growth()
returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'total', (select count(*) from public.techniques where owner_id is null),
    'added_7d', (select count(*) from public.techniques where owner_id is null and created_at > now() - interval '7 days'),
    'from_questions', (select count(*) from public.technique_drafts where status = 'approved' and note like '%질문%'),
    'last_run', (
      select json_build_object('run_on', r.run_on, 'questions', coalesce(r.questions, 0), 'drafted', coalesce(cardinality(r.drafted), 0))
      from public.map_agent_runs r where r.status = 'done' order by r.run_on desc limit 1
    ),
    'recent', (
      select coalesce(json_agg(json_build_object('slug', t.slug, 'name', t.name_ko) order by t.created_at desc), '[]'::json)
      from (select slug, name_ko, created_at from public.techniques where owner_id is null order by created_at desc limit 6) t
    )
  )
$$;
revoke all on function public.map_growth() from public, anon;
grant execute on function public.map_growth() to authenticated;
