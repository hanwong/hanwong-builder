-- 수업 내용을 지워도 출석은 남긴다 (D-152).
-- 출석(gym_attendance)은 수업 줄(gym_classes)에 붙어 있어서, 줄을 지우면 출석까지 같이 지워졌다(2026-11-10 본인 제보).
-- 이제 출석이 있는 수업 줄을 지우려 하면 줄은 남기고 내용만 비운다: 메모 · 기술을 지우고 '내용 없이 출석만 열린 수업'(open)으로.
-- 체육관 자체를 지울 때(체육관 줄이 이미 사라진 뒤 연쇄로 지워질 때)는 그대로 지운다.
create or replace function public.keep_attended_class()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.gyms g where g.id = old.gym_id)
     and exists (select 1 from public.gym_attendance a where a.gym_class_id = old.id) then
    delete from public.gym_class_techniques where gym_class_id = old.id;
    update public.gym_classes set body = '', status = 'open' where id = old.id;
    return null; -- 지우기 취소(줄은 남음)
  end if;
  return old;
end;
$$;
revoke execute on function public.keep_attended_class() from public, anon, authenticated;

drop trigger if exists gym_classes_keep_attended on public.gym_classes;
create trigger gym_classes_keep_attended
  before delete on public.gym_classes
  for each row execute function public.keep_attended_class();
