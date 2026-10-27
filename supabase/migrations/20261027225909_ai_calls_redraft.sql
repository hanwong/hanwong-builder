-- D-48: 운영 화면 "다시 추천" 횟수도 ai_calls 에 센다(kind = 'redraft', 운영자만). 정리하기 한도는 'organize' 만 센다.
alter table public.ai_calls drop constraint if exists ai_calls_kind_check;
alter table public.ai_calls add constraint ai_calls_kind_check check (kind in ('organize', 'redraft'));

drop policy if exists "ai_calls: 자기 것 추가" on public.ai_calls;
create policy "ai_calls: 자기 것 추가" on public.ai_calls
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (kind = 'organize' or (select public.is_operator())));
