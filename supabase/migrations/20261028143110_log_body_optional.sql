-- D-56: 기술을 먼저 고르고 메모는 선택 — 기술만 고른 기록은 메모(body)가 빈 글로 저장된다.
-- 기술도 메모도 없는 기록은 앱(saveLog · updateLog)에서 막는다.
alter table public.class_logs drop constraint class_logs_body_len;
alter table public.class_logs add constraint class_logs_body_len check (char_length(body) between 0 and 5000);
