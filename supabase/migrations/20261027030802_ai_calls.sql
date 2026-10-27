-- D-43: 정리하기(Claude 호출) 횟수 세기 — 사람당 일주일 3번. 글 내용 · 결과는 넣지 않는다.
create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'organize' check (kind in ('organize')),
  called_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index ai_calls_user_called_idx on public.ai_calls (user_id, called_at);

alter table public.ai_calls enable row level security;

-- 본인 것만 보기 · 추가. 수정 · 삭제 정책 없음(= 못 함).
create policy "ai_calls: 자기 것 보기" on public.ai_calls
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_calls: 자기 것 추가" on public.ai_calls
  for insert to authenticated with check (user_id = (select auth.uid()));
