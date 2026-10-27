-- D-50 보완: 정책 안에서 같은 표를 세면 "infinite recursion" — 내 대기 제안 수는 함수로 센다.
create or replace function public.my_pending_suggestions() returns bigint
language sql stable security definer set search_path = '' as $$
  select count(*) from public.technique_suggestions where user_id = (select auth.uid()) and status = 'pending';
$$;
revoke execute on function public.my_pending_suggestions() from public, anon;
grant execute on function public.my_pending_suggestions() to authenticated;

drop policy if exists "suggestions: 자기 것 보내기 (대기 10개까지)" on public.technique_suggestions;
create policy "suggestions: 자기 것 보내기 (대기 10개까지)" on public.technique_suggestions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending' and decided_at is null
    and (select public.my_pending_suggestions()) < 10
  );
