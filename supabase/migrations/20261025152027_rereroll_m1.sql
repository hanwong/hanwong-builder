-- Re:Re:롤 M1 — DB.md 그대로. 표 7개 · 제약 · 인덱스 · RLS · 시드(포지션 8 · 기술 예시 10, 미검수)

-- ── 콘텐츠 표 ─────────────────────────────────────────────
create table public.positions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_ko     text not null,
  name_en     text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table public.techniques (
  id           uuid primary key default gen_random_uuid(),
  position_id  uuid not null references public.positions(id) on delete restrict,
  slug         text not null unique,
  name_ko      text not null,
  name_en      text not null,
  aliases      text[] not null default '{}',
  steps        text[] not null,
  is_reviewed  boolean not null default false,
  source       text,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  constraint techniques_steps_len check (array_length(steps, 1) between 1 and 8)
);
create index techniques_position_idx on public.techniques (position_id, sort_order);

-- ── 사용자 표 ─────────────────────────────────────────────
create table public.class_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_on   date not null,                       -- 서버가 Asia/Seoul 기준으로 넣는다
  body        text not null,
  terms       jsonb not null default '[]'::jsonb,  -- [{term, meaning}]
  ai_status   text not null default 'none',
  created_at  timestamptz not null default now(),
  constraint class_logs_ai_status check (ai_status in ('mock','ok','failed','none')),
  constraint class_logs_body_len check (char_length(body) between 1 and 5000)
);
create index class_logs_user_date_idx on public.class_logs (user_id, logged_on desc);

create table public.class_log_techniques (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  class_log_id  uuid not null references public.class_logs(id) on delete cascade,
  technique_id  uuid references public.techniques(id) on delete restrict,
  custom_name   text,
  created_at    timestamptz not null default now(),
  constraint clt_one_of check (technique_id is not null or (custom_name is not null and char_length(custom_name) between 1 and 100))
);
create unique index clt_log_technique_uidx on public.class_log_techniques (class_log_id, technique_id) where technique_id is not null;
create index clt_user_technique_idx on public.class_log_techniques (user_id, technique_id);

create table public.technique_levels (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  technique_id  uuid not null references public.techniques(id) on delete restrict,
  level         text not null default 'beginner',
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint technique_levels_level check (level in ('beginner','novice','intermediate','advanced','pro')),
  constraint technique_levels_user_technique_uniq unique (user_id, technique_id)
);

create table public.review_cards (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  technique_id      uuid not null references public.techniques(id) on delete restrict,
  interval_step     int  not null default 0,     -- 0=1일 1=3일 2=7일 3=14일 4=30일 (D-09)
  due_on            date not null,               -- 서버가 Asia/Seoul 기준으로 넣는다
  reviews_count     int  not null default 0,
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now(),
  constraint review_cards_step check (interval_step between 0 and 4),
  constraint review_cards_user_technique_uniq unique (user_id, technique_id)
);
create index review_cards_user_due_idx on public.review_cards (user_id, due_on);

create table public.review_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  review_card_id  uuid not null references public.review_cards(id) on delete cascade,
  rating          text not null,
  prev_step       int  not null,
  next_step       int  not null,
  reviewed_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint review_logs_rating check (rating in ('again','hard','good','easy')),
  constraint review_logs_steps check (prev_step between 0 and 4 and next_step between 0 and 4)
);
create index review_logs_user_idx on public.review_logs (user_id, reviewed_at desc);

-- ── 접근 규칙 (RLS) — DB.md 5장 표와 같게 ───────────────────
alter table public.positions            enable row level security;
alter table public.techniques           enable row level security;
alter table public.class_logs           enable row level security;
alter table public.class_log_techniques enable row level security;
alter table public.technique_levels     enable row level security;
alter table public.review_cards         enable row level security;
alter table public.review_logs          enable row level security;

-- 콘텐츠: 로그인한 사람은 보기만. 쓰기 정책 없음(마이그레이션 · 시드로만).
create policy "positions: 로그인 보기"  on public.positions  for select to authenticated using (true);
create policy "techniques: 검수된 것 보기" on public.techniques for select to authenticated using (is_reviewed = true);

-- 사용자 표: 자기 것만
create policy "class_logs: 자기 것 보기"   on public.class_logs for select to authenticated using (user_id = auth.uid());
create policy "class_logs: 자기 것 추가"   on public.class_logs for insert to authenticated with check (user_id = auth.uid());
create policy "class_logs: 자기 것 수정"   on public.class_logs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "class_logs: 자기 것 삭제"   on public.class_logs for delete to authenticated using (user_id = auth.uid());

create policy "clt: 자기 것 보기" on public.class_log_techniques for select to authenticated using (user_id = auth.uid());
create policy "clt: 자기 것 추가" on public.class_log_techniques for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.class_logs l where l.id = class_log_id and l.user_id = auth.uid()));
create policy "clt: 자기 것 삭제" on public.class_log_techniques for delete to authenticated using (user_id = auth.uid());

create policy "levels: 자기 것 보기" on public.technique_levels for select to authenticated using (user_id = auth.uid());
create policy "levels: 자기 것 추가" on public.technique_levels for insert to authenticated with check (user_id = auth.uid());
create policy "levels: 자기 것 수정" on public.technique_levels for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "levels: 자기 것 삭제" on public.technique_levels for delete to authenticated using (user_id = auth.uid());

create policy "cards: 자기 것 보기" on public.review_cards for select to authenticated using (user_id = auth.uid());
create policy "cards: 자기 것 추가" on public.review_cards for insert to authenticated with check (user_id = auth.uid());
create policy "cards: 자기 것 수정" on public.review_cards for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cards: 자기 것 삭제" on public.review_cards for delete to authenticated using (user_id = auth.uid());

create policy "rlogs: 자기 것 보기" on public.review_logs for select to authenticated using (user_id = auth.uid());
create policy "rlogs: 자기 것 추가" on public.review_logs for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.review_cards c where c.id = review_card_id and c.user_id = auth.uid()));

-- ── 시드: 포지션 8 ────────────────────────────────────────
insert into public.positions (slug, name_ko, name_en, sort_order) values
  ('standing',      '스탠딩',       'Standing',       1),
  ('closed-guard',  '클로즈드 가드', 'Closed Guard',   2),
  ('open-guard',    '오픈 가드',    'Open Guard',     3),
  ('half-guard',    '하프가드',     'Half Guard',     4),
  ('passing',       '패스',         'Guard Passing',  5),
  ('side-control',  '사이드 컨트롤', 'Side Control',   6),
  ('mount',         '마운트',       'Mount',          7),
  ('back-control',  '백 컨트롤',    'Back Control',   8);

-- ── 시드: 기술 예시 10 (전부 미검수 초안 — 본인 검수 전엔 앱에서 숨김) ──
insert into public.techniques (position_id, slug, name_ko, name_en, aliases, steps, is_reviewed, source, sort_order)
select p.id, t.slug, t.name_ko, t.name_en, t.aliases, t.steps, false, 'AI 초안 · 검수 전', t.sort_order
from (values
  ('open-guard',   'de-la-riva-guard', '데라히바 가드', 'De La Riva Guard', array['DLR','데라'],
     array['상대 한쪽 다리 바깥으로 내 다리를 감는다','같은 쪽 발목(또는 바지 끝)을 잡는다','반대 발은 상대 허벅지나 골반에 둔다','반대 손으로 소매나 깃을 잡아 상체를 컨트롤한다'], 1),
  ('closed-guard', 'closed-guard-armbar', '클로즈드 가드 암바', 'Armbar from Closed Guard', array['암바','주짓수 암바'],
     array['상대 한쪽 팔을 몸 안쪽으로 당겨 컨트롤한다','같은 쪽 발을 상대 골반에 밟고 엉덩이를 돌려 각도를 만든다','반대 다리를 상대 등 위로 올리고 머리를 눌러 자세를 낮춘다','다리를 교차하거나 모아 조이고 엉덩이를 들어 팔꿈치를 편다'], 1),
  ('closed-guard', 'triangle-choke', '트라이앵글 초크', 'Triangle Choke', array['트라이앵글','삼각 조르기'],
     array['상대 한 팔은 안에, 한 팔은 밖에 두게 만든다','안쪽 팔 쪽 다리를 상대 목 뒤로 올리고 각도를 튼다','그 발목을 반대 무릎 뒤에 걸어 삼각형을 만든다','상대 머리를 당기며 다리를 조인다'], 2),
  ('closed-guard', 'scissor-sweep', '시저 스윕', 'Scissor Sweep', array['가위 스윕'],
     array['깃과 소매를 잡고 상대 상체를 당긴다','한 무릎을 상대 배 앞에 가로로 대고 반대 다리는 바닥 가까이 편다','가로 다리는 밀고 아래 다리는 걸어 가위처럼 돌린다','위로 올라와 마운트를 잡는다'], 3),
  ('passing',      'knee-slice-pass', '니슬라이스 패스', 'Knee Slice Pass', array['니컷','니스루','knee cut'],
     array['상대 다리 사이에서 한 무릎을 허벅지 위로 올린다','같은 쪽 언더훅 또는 깃을 잡아 상체를 눌러 둔다','무릎을 바닥으로 미끄러뜨리며 다리를 빼낸다','가슴을 붙여 사이드 컨트롤로 자리 잡는다'], 1),
  ('passing',      'toreando-pass', '토레안도 패스', 'Toreando Pass', array['불 패스','토레아도'],
     array['상대 무릎 뒤 또는 바지 끝을 양손으로 잡는다','다리를 한쪽으로 밀어 넘기며 반대쪽으로 돈다','상대 엉덩이를 지나 가슴으로 누른다','사이드 컨트롤로 자리 잡는다'], 2),
  ('side-control', 'side-control-escape', '사이드 이스케이프', 'Side Control Escape (Hip Escape)', array['힙 이스케이프','쉬림프'],
     array['팔꿈치와 손으로 프레임을 만들어 상대 목과 골반에 댄다','발로 밀며 엉덩이를 빼서 공간을 만든다','가까운 무릎을 상대와 나 사이로 넣는다','가드로 돌아오거나 돌아서 일어난다'], 1),
  ('mount',        'mount-escape-upa', '마운트 이스케이프 (업파)', 'Mount Escape (Upa / Bridge and Roll)', array['업파','브릿지 앤 롤'],
     array['상대 한 팔과 같은 쪽 발을 묶는다(트랩)','발을 엉덩이 가까이 당겨 세운다','묶은 쪽으로 다리를 뻗으며 브릿지한다','굴러 넘겨 가드 안에 자리 잡는다'], 1),
  ('back-control', 'rear-naked-choke', '리어 네이키드 초크', 'Rear Naked Choke', array['RNC','백 초크'],
     array['양 훅을 넣고 가슴을 상대 등에 붙인다','한 팔을 상대 목 앞으로 넣어 팔꿈치가 턱 아래에 오게 한다','그 손을 반대 팔 이두에 걸고 반대 손은 상대 뒤통수에 둔다','가슴을 펴며 팔꿈치를 모아 조인다'], 1),
  ('half-guard',   'half-guard-underhook-sweep', '하프가드 언더훅 스윕', 'Half Guard Underhook Sweep', array['언더훅 스윕','올드 스쿨 스윕'],
     array['하프가드에서 언더훅을 잡고 옆으로 돌아 눕는다(무릎 방패 대신 밀착)','머리를 상대 겨드랑이 아래로 넣어 자세를 낮춘다','상대 발목을 잡거나 다리를 걸어 중심을 뺏는다','앞으로 밀며 올라와 탑으로 간다'], 1)
) as t(position_slug, slug, name_ko, name_en, aliases, steps, sort_order)
join public.positions p on p.slug = t.position_slug;
