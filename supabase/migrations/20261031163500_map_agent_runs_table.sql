-- D-102 (M2-18): 매일 지도 키우기 에이전트가 날마다 한 일. 운영자만 보기, 쓰기는 서버 전용 키(RLS 를 거치지 않음)로만.
-- (바로 앞 20261031162316_map_agent_runs.sql 은 만들다 멈춰 빈 채로 올라갔다 — 내용은 여기)

create table public.map_agent_runs (
  id            uuid primary key default gen_random_uuid(),
  run_on        date not null unique,
  status        text not null default 'running',
  topic         text,
  summary       text,
  drafted       text[] not null default '{}',
  questions     int not null default 0,
  searches      int not null default 0,
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  created_at    timestamptz not null default now(),
  finished_at   timestamptz,
  constraint map_agent_runs_status check (status in ('running', 'done', 'failed')),
  constraint map_agent_runs_summary_len check (char_length(summary) <= 1000)
);
alter table public.map_agent_runs enable row level security;
create policy "map_agent_runs: 운영자 보기" on public.map_agent_runs for select to authenticated
  using ((select public.is_operator()));
