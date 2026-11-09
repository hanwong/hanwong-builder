-- D-131 그랄(벨트 줄) — 관원이 내 설정에서 0~4(블랙 0~10)를 고른다. 값은 벨트처럼 로그인 계정 정보(user_metadata.stripes)에.
-- 관장 · 코치 관원 목록에서 벨트순 정렬 · "N그랄" 표시에 쓰도록 이름 함수에 stripes 칸을 더한다(새 표 없음).
drop function if exists public.gym_member_names(uuid);
create or replace function public.gym_member_names(p_gym uuid)
returns table (user_id uuid, role text, joined_at timestamptz, nick text, belt text, started_on text, real_name text, stripes int)
language sql stable security definer set search_path = '' as $$
  select m.user_id, m.role, m.joined_at,
         coalesce(nullif(btrim(u.raw_user_meta_data->>'nick'), ''), split_part(u.email, '@', 1)),
         u.raw_user_meta_data->>'belt', u.raw_user_meta_data->>'started_on',
         case when public.my_gym_role(p_gym) in ('owner', 'coach') then m.real_name end,
         case when (u.raw_user_meta_data->>'stripes') ~ '^\d{1,2}$' then (u.raw_user_meta_data->>'stripes')::int else 0 end
  from public.gym_members m join auth.users u on u.id = m.user_id
  where m.gym_id = p_gym and public.my_gym_role(p_gym) is not null;
$$;
revoke execute on function public.gym_member_names(uuid) from public, anon;
grant execute on function public.gym_member_names(uuid) to authenticated;
