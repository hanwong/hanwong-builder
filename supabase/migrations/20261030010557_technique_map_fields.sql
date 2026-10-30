-- D-81: 기술 지도 칸 + 공용 목록을 로그인 없이 읽기(온라인 MCP 용). 사용자 표는 그대로 막혀 있다.
alter table public.techniques
  add column if not exists kind text check (kind is null or kind in ('takedown','guard_pull','sweep','pass','submission','escape','back_take','transition','control','defense')),
  add column if not exists role text check (role is null or role in ('top','bottom','standing','both')),
  add column if not exists ends_at text[] not null default '{}',
  add column if not exists key_points text[] not null default '{}',
  add column if not exists mistakes text[] not null default '{}',
  add column if not exists if_blocked text[] not null default '{}',
  add column if not exists defense text[] not null default '{}';

-- 로그인 안 한 사람(anon): 포지션 전부 · 공용 기술(owner_id 없음)만 읽기. 쓰기는 없음.
drop policy if exists "positions: 누구나 보기" on public.positions;
create policy "positions: 누구나 보기" on public.positions for select to anon using (true);
drop policy if exists "techniques: 누구나 공용 보기" on public.techniques;
create policy "techniques: 누구나 공용 보기" on public.techniques for select to anon using (owner_id is null);
