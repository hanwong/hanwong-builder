-- D-88: open_mat_me 는 표를 읽지 않고 로그인 토큰만 보므로 특별 권한(security definer)이 필요 없다
alter function public.open_mat_me() security invoker;
