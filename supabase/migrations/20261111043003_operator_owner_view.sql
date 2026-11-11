-- D-180: 운영자 임시 "관장 화면 보기만". 운영자(operators 줄)가 owner_view 를 켜면, 자기가 코치로 있는 체육관에서
-- 관장 화면(설정 · 코치 코드 포함)을 볼 수 있다. 바꾸기 · 지우기 · 넘기기는 그대로 진짜 관장만(표 규칙 · 함수는 my_gym_role 기준 그대로).
-- 끄기: update public.operators set owner_view = false;  (마이그레이션으로)
alter table public.operators add column if not exists owner_view boolean not null default false;
update public.operators set owner_view = true;

create or replace function public.operator_owner_view() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.operators where user_id = (select auth.uid()) and owner_view);
$$;
revoke execute on function public.operator_owner_view() from public, anon;
grant execute on function public.operator_owner_view() to authenticated;

-- 가입 코드: 운영자 보기 모드면 코치여도 두 코드를 본다(읽기만)
create or replace function public.gym_codes(p_gym uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case
    when public.my_gym_role(p_gym) = 'owner'
      or (public.my_gym_role(p_gym) = 'coach' and public.operator_owner_view())
      then jsonb_build_object('join_code', join_code, 'coach_code', coach_code)
    when public.my_gym_role(p_gym) = 'coach' then jsonb_build_object('join_code', join_code)
  end
  from public.gyms where id = p_gym;
$$;
revoke execute on function public.gym_codes(uuid) from public, anon;
grant execute on function public.gym_codes(uuid) to authenticated;
