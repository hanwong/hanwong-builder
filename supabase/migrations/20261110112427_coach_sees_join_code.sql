-- 가입 코드 보기(D-161) — 관장은 관원 · 코치 코드 둘 다, 코치는 관원 코드만(관원을 데려올 수 있게).
-- 코치 코드는 여전히 관장만. 관원은 못 봄(null)
create or replace function public.gym_codes(p_gym uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case public.my_gym_role(p_gym)
    when 'owner' then jsonb_build_object('join_code', join_code, 'coach_code', coach_code)
    when 'coach' then jsonb_build_object('join_code', join_code)
  end
  from public.gyms where id = p_gym;
$$;
revoke execute on function public.gym_codes(uuid) from public, anon;
grant execute on function public.gym_codes(uuid) to authenticated;
