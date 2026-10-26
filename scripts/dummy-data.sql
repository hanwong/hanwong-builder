-- T-13 · D-28: 화면이 비어 보이지 않게 한 계정에 가짜 기록 5개 · 카드 7장을 넣는다.
-- 표시: 글이 전부 "[예시]" 로 시작한다 → 화면에서 진짜 기록과 구분되고, 지울 때 이것으로 찾는다.
-- 쓰는 법: __USER_ID__ 를 그 계정 id 로 바꿔 Supabase SQL 로 한 번 실행(관리자). 지우기는 dummy-data-remove.sql.
-- 날짜는 실행한 날(서울) 기준으로 잡는다. 표 구조는 안 바꾸므로 migration 이 아니다.
begin;

create temp table _seed (n int, days_ago int, body text, terms jsonb, techniques text[], levels text[]) on commit drop;
insert into _seed values
  (1, 12, '[예시] 클로즈드 가드 기본. 상대 소매랑 깃 잡고 시저 스윕. 한쪽 정강이는 배에, 다른 다리는 무릎 뒤를 자르듯이.',
   '[{"term":"그립","meaning":"도복 · 손목 · 팔을 잡는 방법"}]', array['scissor-sweep'], array['novice']),
  (2, 9, '[예시] 마운트 깔렸을 때 업파 연습. 상대 팔 하나랑 같은 쪽 발 막고 브릿지. 엘보 이스케이프도 같이 함.',
   '[{"term":"브릿지","meaning":"엉덩이를 높이 들어 상대를 띄우는 것"}]', array['mount-escape-upa','mount-escape-elbow'], array['beginner','beginner']),
  (3, 6, '[예시] 트라이앵글 초크. 팔 하나 넣고 다리로 목 감아서 각도 틀기. 스파링에서 한 번 성공!',
   '[]', array['triangle-choke'], array['intermediate']),
  (4, 4, '[예시] 니슬라이스 패스랑 토레안도. 니슬라이스는 언더훅 먼저, 토레안도는 바지 잡고 옆으로 돌기.',
   '[{"term":"언더훅","meaning":"상대 겨드랑이 밑으로 팔을 넣어 감는 것"},{"term":"패스","meaning":"상대 다리(가드)를 넘어 사이드나 마운트로 가는 것"}]',
   array['knee-slice-pass','toreando-pass'], array['novice','beginner']),
  (5, 2, '[예시] 사이드 깔렸을 때 프레임 만들고 쉬림프로 가드 회복. 관장님이 팔꿈치를 몸에 붙이라고 하심.',
   '[{"term":"프레임","meaning":"팔 · 다리를 뼈대처럼 세워 거리를 지키는 것"},{"term":"새우빼기","meaning":"옆으로 누워 엉덩이를 빼며 공간을 만드는 움직임"}]',
   array['side-control-escape'], array['beginner']);

-- 기록
create temp table _logs on commit drop as
with ins as (
  insert into public.class_logs (user_id, logged_on, body, terms, ai_status)
  select '__USER_ID__'::uuid, (now() at time zone 'Asia/Seoul')::date - days_ago, body, terms, 'mock'
  from _seed order by n
  returning id, body
)
select s.n, ins.id from ins join _seed s on s.body = ins.body;

-- 기록 ↔ 기술 · 숙련도
insert into public.class_log_techniques (user_id, class_log_id, technique_id)
select '__USER_ID__'::uuid, l.id, t.id
from _seed s join _logs l on l.n = s.n, unnest(s.techniques) as x(slug) join public.techniques t on t.slug = x.slug;

insert into public.technique_levels (user_id, technique_id, level)
select '__USER_ID__'::uuid, t.id, lv
from _seed s, unnest(s.techniques, s.levels) as x(slug, lv) join public.techniques t on t.slug = x.slug
on conflict (user_id, technique_id) do nothing;

-- 복습 카드 — 일부는 오늘(또는 지난날) 복습, 일부는 나중 (단계 · 복습 횟수도 다양하게)
insert into public.review_cards (user_id, technique_id, interval_step, due_on, reviews_count)
select '__USER_ID__'::uuid, t.id, c.step, (now() at time zone 'Asia/Seoul')::date + c.due_in, c.reviews
from (values
  ('scissor-sweep', 2, 0, 2),
  ('mount-escape-upa', 1, -1, 1),
  ('mount-escape-elbow', 0, 0, 0),
  ('triangle-choke', 2, 4, 2),
  ('knee-slice-pass', 1, 0, 1),
  ('toreando-pass', 0, 1, 0),
  ('side-control-escape', 0, -1, 0)
) as c(slug, step, due_in, reviews)
join public.techniques t on t.slug = c.slug
on conflict (user_id, technique_id) do nothing;

commit;
