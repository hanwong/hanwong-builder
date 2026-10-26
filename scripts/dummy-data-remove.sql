-- T-13 · D-28: dummy-data.sql 로 넣은 가짜 기록을 한 번에 지운다.
-- "[예시]" 로 시작하는 기록과, 그 가짜 기록에만 연결돼 있던 기술의 카드(응답 기록 포함) · 숙련도를 지운다.
-- 진짜 기록에도 나온 기술의 카드 · 숙련도는 그대로 둔다.
-- 쓰는 법: __USER_ID__ 를 그 계정 id 로 바꿔 Supabase SQL 로 실행(관리자).
begin;

create temp table _dummy_tech on commit drop as
select distinct c.technique_id
from public.class_log_techniques c join public.class_logs l on l.id = c.class_log_id
where l.user_id = '__USER_ID__'::uuid and l.body like '[예시]%' and c.technique_id is not null;

delete from public.class_logs where user_id = '__USER_ID__'::uuid and body like '[예시]%'; -- 연결은 같이 지워짐

-- 남은(진짜) 기록에 없는 것만
delete from public.review_cards r
using _dummy_tech d
where r.user_id = '__USER_ID__'::uuid and r.technique_id = d.technique_id
  and not exists (select 1 from public.class_log_techniques c where c.user_id = r.user_id and c.technique_id = r.technique_id);

delete from public.technique_levels v
using _dummy_tech d
where v.user_id = '__USER_ID__'::uuid and v.technique_id = d.technique_id
  and not exists (select 1 from public.class_log_techniques c where c.user_id = v.user_id and c.technique_id = v.technique_id);

commit;
