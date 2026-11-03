-- D-115 (M2-21): 질문하기를 로그인한 모든 사용자에게. 하루 횟수(사용자 3 · 운영자 30)는 앱 서버가 ai_calls(kind ask)로 센다.

drop policy if exists "questions: 운영자 자기 것 추가" on public.questions;
create policy "questions: 자기 것 추가" on public.questions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "ai_calls: 자기 것 추가" on public.ai_calls;
create policy "ai_calls: 자기 것 추가" on public.ai_calls
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (kind in ('organize', 'user_draft', 'ask') or (select public.is_operator())));
