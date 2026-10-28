-- D-64 · T-48: 스파링 몇 판(0~50). 기록 한 건마다. 기존 기록은 0.
alter table public.class_logs
  add column sparring_rounds smallint not null default 0,
  add constraint class_logs_sparring_rounds check (sparring_rounds between 0 and 50);
