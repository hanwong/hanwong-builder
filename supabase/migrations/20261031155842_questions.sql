-- D-100 · D-101 (M2-17): 질문하기 — 질문 · AI 답 · 답에 나온 기술. 본인 것만 보기 · 지우기, 추가는 지금은 운영자만.

create table public.questions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  asked_on   date not null,
  question   text not null,
  answer     text not null,
  slugs      text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint questions_question_len check (char_length(question) between 2 and 500),
  constraint questions_answer_len check (char_length(answer) between 1 and 6000),
  constraint questions_slugs_len check (cardinality(slugs) <= 12)
);
create index questions_user_day_idx on public.questions (user_id, asked_on desc, created_at desc);
alter table public.questions enable row level security;

create policy "questions: 자기 것 보기" on public.questions for select to authenticated
  using (user_id = (select auth.uid()));
-- 사용자에게 열 때(D-100 미정 15) 이 정책에서 is_operator() 를 뺀다
create policy "questions: 운영자 자기 것 추가" on public.questions for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_operator()));
create policy "questions: 자기 것 지우기" on public.questions for delete to authenticated
  using (user_id = (select auth.uid()));

-- 횟수(ai_calls) — 질문하기 kind 추가
alter table public.ai_calls drop constraint if exists ai_calls_kind_check;
alter table public.ai_calls add constraint ai_calls_kind_check check (kind in ('organize', 'redraft', 'user_draft', 'ask'));
