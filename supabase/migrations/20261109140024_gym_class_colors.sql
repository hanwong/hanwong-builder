-- D-137 수업 이름별 색 — 스케줄 탭 시간표 칸 색. 체육관마다 이름 하나에 색 하나(이름 글자 그대로 연결).
-- 색은 hex 가 아니라 정해 둔 이름(화면 토큰 --class-<색>)으로 저장해 밤 화면에서도 맞게 보이게 한다.
create table if not exists public.gym_class_colors (
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 20),
  color text not null check (color in ('white','yellow','mint','sky','pink','lavender','peach','gray')),
  updated_at timestamptz not null default now(),
  primary key (gym_id, name)
);
alter table public.gym_class_colors enable row level security;
create policy "gym_class_colors: 같은 체육관 보기" on public.gym_class_colors for select to authenticated
  using (public.my_gym_role(gym_id) is not null);
create policy "gym_class_colors: 관장 · 코치 쓰기" on public.gym_class_colors for all to authenticated
  using (public.my_gym_role(gym_id) in ('owner','coach')) with check (public.my_gym_role(gym_id) in ('owner','coach'));
