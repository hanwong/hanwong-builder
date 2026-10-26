-- D-32: 기록에 직접 적은 기술 이름(목록에 없음) 모아 보기 — 라이브러리에 넣을 후보.
-- 관리자 SQL 로 실행(읽기만). 많이 나온 순서.
select c.custom_name,
       count(*)              as times,      -- 몇 번 적혔나
       count(distinct c.user_id) as people, -- 몇 명이
       min(l.logged_on)      as first_seen,
       max(l.logged_on)      as last_seen
from public.class_log_techniques c
join public.class_logs l on l.id = c.class_log_id
where c.custom_name is not null
group by c.custom_name
order by times desc, last_seen desc;
