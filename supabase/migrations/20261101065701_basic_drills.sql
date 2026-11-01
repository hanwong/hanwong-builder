-- D-112: 기본 드릴 모음 — 혼자 하는 움직임 12개. 기술 탭 맨 위(모든 벨트) · 화이트 벨트 홈에 보인다.
-- 누구나 보기, 쓰기는 마이그레이션으로만(개념 카드 concepts 와 같음). 내용은 화이트 벨트 눈높이로 우리 말로 새로 씀(사람 확인 전, D-86).
-- 이어지는 기술(related_techniques)은 공용 기술 slug — 없는 slug 가 있으면 멈춘다.

create table if not exists public.drills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ko text not null,
  name_en text not null,
  aliases text[] not null default '{}',
  summary text not null,
  steps text[] not null default '{}',
  tips text[] not null default '{}',
  why text[] not null default '{}',
  related_techniques text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.drills enable row level security;
create policy "drills: 누구나 보기" on public.drills for select using (true);

insert into public.drills (slug, name_ko, name_en, aliases, summary, steps, tips, why, related_techniques, sort_order) values
(
  'shrimp', '새우빼기', 'Shrimp', array['쉬림프','힙 이스케이프','엉덩이 빼기'],
  '누워서 한 발로 바닥을 밀어 엉덩이를 옆으로 빼는 움직임 — 깔렸을 때 공간을 만드는 첫 동작',
  array[
    '등을 대고 누워 두 무릎을 세운다',
    '오른발로 바닥을 밀며 몸을 왼쪽으로 돌려 옆으로 눕는다',
    '엉덩이를 뒤로(머리 반대쪽으로) 빼며 두 손은 앞으로 밀어낸다',
    '다시 등을 대고 반대쪽으로 — 매트 끝까지 번갈아 간다'
  ]::text[],
  array[
    '엉덩이가 먼저 빠져야 한다 — 어깨만 움직이면 제자리에서 꿈틀거릴 뿐이다',
    '옆으로 누울 때 어깨 바깥쪽이 바닥에 닿게 완전히 돈다',
    '손은 상대를 밀어내는 프레임처럼 쭉 뻗는다',
    '아래쪽 무릎은 가슴 쪽으로 당겨 다음에 다리를 넣을 자리를 만든다'
  ]::text[],
  array[
    '사이드 · 마운트 아래에서 빠지는 거의 모든 탈출이 이 움직임으로 시작한다',
    '상대가 다리를 넘어오려 할 때 엉덩이를 빼서 가드를 다시 넣는 것도 같은 동작이다'
  ]::text[],
  array['shrimp-hip-escape','side-control-escape','mount-escape-elbow','half-guard-recovery','open-guard-retention']::text[],
  1
),
(
  'reverse-shrimp', '역새우', 'Reverse Shrimp', array['리버스 쉬림프','거꾸로 새우'],
  '새우빼기를 거꾸로 — 엉덩이를 머리 쪽으로 밀어 올리며 등으로 이동하는 움직임',
  array[
    '등을 대고 누워 두 무릎을 세운다',
    '두 발로 바닥을 밀어 엉덩이를 살짝 든다',
    '어깨를 축으로 엉덩이를 머리 쪽으로 밀어 올리며 등 위쪽으로 미끄러진다',
    '조금씩 이어 매트 끝까지 머리 방향으로 간다'
  ]::text[],
  array[
    '턱은 당긴다 — 목이 꺾이지 않게 어깨 위쪽으로 받는다',
    '한쪽 어깨에 조금 더 실어 비스듬히 가면 더 부드럽다',
    '작게 여러 번 — 한 번에 멀리 가려 하지 않는다'
  ]::text[],
  array[
    '상대가 내 다리 쪽으로 붙어 올 때 머리 쪽으로 빠지며 거리를 다시 벌린다',
    '니 온 밸리 · 사이드에서 다리를 돌려 넣을 각도를 만드는 데 쓴다'
  ]::text[],
  array['open-guard-retention','knee-on-belly-escape','guard-recovery-from-combat-base']::text[],
  2
),
(
  'bridge', '브릿지', 'Bridge', array['업파','브릿징','엉덩이 들기'],
  '발과 어깨로 받치고 엉덩이를 높이 들어 올리는 움직임 — 위에 있는 사람을 흔드는 힘',
  array[
    '등을 대고 누워 두 발을 엉덩이 가까이 붙인다',
    '발바닥으로 바닥을 밀어 엉덩이를 높이 든다',
    '정점에서 한쪽 어깨(왼쪽) 너머로 몸을 비튼다',
    '내려와 반대쪽으로 — 10번씩 번갈아'
  ]::text[],
  array[
    '발은 엉덩이에 붙을 만큼 가깝게 — 멀면 힘이 안 실린다',
    '발끝이 아니라 발바닥 전체 · 뒤꿈치로 민다',
    '위로만이 아니라 내 머리 위 대각선으로 민다는 느낌',
    '목으로 들지 않는다 — 어깨 위쪽과 발로 받친다'
  ]::text[],
  array[
    '마운트 아래 업파 탈출은 브릿지 하나로 상대를 넘긴다',
    '눌릴 때 브릿지로 상대 무게를 잠깐 띄워야 새우빼기할 틈이 생긴다'
  ]::text[],
  array['mount-escape-upa','bridge-and-roll-from-side','bridge-escape-from-kesa','hip-bump-sweep']::text[],
  3
),
(
  'forward-roll', '앞구르기 (어깨)', 'Forward Shoulder Roll', array['앞구르기','어깨 앞구르기','숄더 롤'],
  '머리가 아니라 한쪽 어깨에서 반대쪽 엉덩이로 대각선으로 굴러 앞으로 넘어가는 움직임',
  array[
    '한쪽 무릎을 꿇고 오른손 · 오른팔을 앞 바닥에 둥글게 놓는다',
    '고개를 왼쪽으로 돌려 머리를 팔 안쪽으로 비켜 둔다',
    '오른쪽 어깨 → 등 → 왼쪽 엉덩이 순서로 대각선으로 구른다',
    '다 굴렀으면 손을 짚고 일어나거나 앉은 자세로 끝낸다'
  ]::text[],
  array[
    '머리 꼭대기가 바닥에 닿으면 안 된다 — 늘 어깨부터',
    '등을 둥글게 말아야 바퀴처럼 부드럽게 구른다',
    '처음엔 무릎 꿇고 아주 천천히, 익숙해지면 서서',
    '목이 불편하면 바로 멈추고 코치에게 자세를 봐 달라고 한다'
  ]::text[],
  array[
    '넘어지거나 던져질 때 머리 · 목을 지키는 기본기다',
    '터틀 · 오모플라타에서 앞으로 굴러 빠지는 탈출이 이 움직임이다'
  ]::text[],
  array['forward-roll-from-turtle','roll-forward-from-omoplata','breakfall']::text[],
  4
),
(
  'backward-roll', '뒤구르기 (어깨)', 'Backward Shoulder Roll', array['뒤구르기','어깨 뒤구르기','백 롤'],
  '앉은 자세에서 뒤로 누우며 한쪽 어깨 너머로 넘어가 무릎으로 내려오는 움직임',
  array[
    '앉아서 두 무릎을 가슴 쪽으로 당긴다',
    '등을 둥글게 말며 뒤로 굴러 고개는 오른쪽으로 돌린다',
    '왼쪽 어깨 너머로 두 다리를 넘긴다',
    '두 무릎(또는 한쪽 무릎)으로 내려와 손을 짚고 선다'
  ]::text[],
  array[
    '머리 뒤가 아닌 어깨 너머로 — 고개를 반대쪽으로 돌려 길을 비운다',
    '무릎을 가슴에 붙여 몸을 작게 말면 쉽게 넘어간다',
    '목에 무게가 실리면 넘기지 말고 다시 앉는다'
  ]::text[],
  array[
    '가드가 눌려 다리가 머리 위로 접힐 때 굴러 빠져 다시 마주 보는 길이다',
    '뒤로 밀려 넘어질 때 다치지 않고 바로 일어서게 해 준다'
  ]::text[],
  array['granby-roll','open-guard-retention','breakfall']::text[],
  5
),
(
  'side-roll', '옆구르기', 'Side Shoulder Roll', array['사이드 롤','어깨 옆구르기'],
  '등 위쪽으로 어깨에서 반대 어깨로 옆으로 굴러 반대편으로 일어나는 움직임 — 그랜비 롤 준비',
  array[
    '무릎 꿇고 엎드린 자세에서 오른쪽 어깨를 바닥 가까이 낮춘다',
    '오른쪽 어깨 → 등 위쪽 → 왼쪽 어깨로 옆으로 구른다',
    '다리는 따라오며 반대편에서 다시 무릎 꿇은 자세로 끝낸다',
    '반대 방향으로 돌아온다 — 양쪽 5번씩'
  ]::text[],
  array[
    '머리는 매트에 대지 않는다 — 어깨 위쪽(견갑골) 위로만 구른다',
    '엉덩이를 높이 두면 구르는 길이 짧아진다',
    '천천히 — 빨리 하면 목에 무게가 실린다'
  ]::text[],
  array[
    '터틀 · 패스 당할 때 굴러 다시 다리를 넣는 그랜비 롤의 몸통 움직임이다',
    '어깨 위로 굴러도 무섭지 않아야 깔렸을 때 빠질 길이 늘어난다'
  ]::text[],
  array['granby-roll','roll-to-turtle','guard-recovery-from-double-unders']::text[],
  6
),
(
  'alligator-crawl', '악어 기기', 'Alligator Crawl', array['악어자세','악어 걷기','앨리게이터 크롤'],
  '팔굽혀펴기 반쯤 내려간 낮은 자세로 반대쪽 손발을 함께 내밀며 기어가는 움직임',
  array[
    '팔굽혀펴기 자세에서 팔꿈치를 굽혀 몸을 바닥 가까이 낮춘다',
    '오른손을 앞으로 내밀며 왼무릎을 왼쪽 팔꿈치 쪽으로 끌어온다',
    '반대로 왼손과 오른무릎 — 몸은 낮게 둔 채 앞으로 간다',
    '매트 끝까지 갔다가 뒤로도 기어 돌아온다'
  ]::text[],
  array[
    '엉덩이가 들리지 않게 — 머리부터 발까지 낮게 일자',
    '무릎은 바닥에 끌지 않고 옆으로 크게 끌어온다',
    '숨을 참지 말고 천천히 — 힘보다 자세'
  ]::text[],
  array[
    '스프롤 · 위에서 누를 때처럼 엉덩이를 낮게 두고 움직이는 힘을 기른다',
    '고관절이 옆으로 열려야 패스할 때 다리를 넓게 옮기고 버틸 수 있다'
  ]::text[],
  array['sprawl','single-leg-from-turtle','knee-slice-pass']::text[],
  7
),
(
  'bear-crawl', '곰 걷기', 'Bear Crawl', array['베어 크롤','네발 걷기'],
  '두 손 두 발로 무릎을 바닥에서 띄운 채 앞뒤 · 옆으로 걷는 움직임',
  array[
    '두 손과 두 발을 바닥에 두고 무릎을 살짝 띄운다',
    '오른손과 왼발을 함께 한 걸음 앞으로',
    '왼손과 오른발 — 등은 평평하게 두고 앞으로 간다',
    '뒤로 · 옆으로도 같은 자세로 걷는다'
  ]::text[],
  array[
    '엉덩이를 어깨 높이로 — 너무 높이 들면 쉬워지고 효과가 줄어든다',
    '고개는 들어 앞을 본다',
    '손은 어깨 바로 밑 — 몸 앞쪽에 무게를 싣는다'
  ]::text[],
  array[
    '서서 가드를 돌아 패스할 때 손 · 발로 버티며 옆으로 움직이는 몸을 만든다',
    '터틀에서 일어서거나 상대 뒤로 돌아갈 때 네발 자세에서 빠르게 움직이게 해 준다'
  ]::text[],
  array['toreando-pass','standing-up-in-base','sprawl']::text[],
  8
),
(
  'technical-stand-up', '테크니컬 스탠드업', 'Technical Stand-Up', array['기본 일어서기','겟업'],
  '앉은 자세에서 한 손 · 한 발로 받치고 다리를 뒤로 빼며 안전하게 일어서는 움직임',
  array[
    '앉아서 왼손을 엉덩이 뒤 바닥에 짚고 오른발을 바닥에 세운다',
    '오른손은 앞으로 뻗어 상대를 막는 자리에 둔다',
    '왼손 · 오른발로 엉덩이를 들어 올린다',
    '왼다리를 손 사이로 뒤로 빼 무릎 꿇거나 선다 — 양쪽 번갈아'
  ]::text[],
  array[
    '빼는 다리는 앞이 아니라 뒤로 — 상대와 거리를 벌리며 선다',
    '일어서는 동안 앞손은 내내 앞에 — 다가오는 상대를 막는 자리',
    '서고 나면 바로 기본 스탠스(오른발 반 보 앞)'
  ]::text[],
  array[
    '오픈 가드 · 시합에서 상대 앞에서 일어설 때 넘어뜨려지지 않는 유일한 안전한 방법이다',
    '가드에서 일어서며 싱글 레그로 이어지는 공격의 시작이기도 하다'
  ]::text[],
  array['technical-stand-up','technical-stand-up-to-single-leg','x-guard-technical-stand-up']::text[],
  9
),
(
  'sprawl', '스프롤', 'Sprawl', array['스프럴','다리 뒤로 빼기'],
  '상대가 다리를 잡으러 들어올 때 두 다리를 뒤로 쭉 빼고 엉덩이로 눌러 막는 움직임',
  array[
    '기본 스탠스로 선다',
    '두 손을 앞 바닥으로 내리며 두 다리를 뒤로 쭉 뻗는다',
    '엉덩이를 바닥 쪽으로 낮춰 가슴 · 골반으로 누른다',
    '다리를 다시 당겨 스탠스로 돌아온다 — 10번'
  ]::text[],
  array[
    '다리는 뒤로 넓게 — 발끝으로 바닥을 짚는다',
    '엉덩이가 들리면 다리를 잡힌다 — 골반을 바닥에 붙인다는 느낌',
    '빨리 내려가고 빨리 돌아오는 게 핵심'
  ]::text[],
  array[
    '더블 · 싱글 레그 테이크다운을 막는 가장 기본 방어다',
    '막고 나서 앞으로 눌러 프론트 헤드락 · 다스 초크로 이어진다'
  ]::text[],
  array['sprawl','darce-from-sprawl','snap-down-from-standing']::text[],
  10
),
(
  'breakfall', '낙법', 'Breakfall', array['뒤낙법','옆낙법','우케미'],
  '넘어질 때 턱을 당기고 팔로 바닥을 쳐 충격을 나눠 받는 움직임',
  array[
    '쪼그려 앉아 두 팔을 앞으로 뻗고 턱을 당긴다',
    '등을 둥글게 말며 뒤로 굴러 눕는다',
    '등이 닿는 순간 두 팔(손바닥 · 팔뚝)로 바닥을 친다',
    '옆낙법은 한쪽 다리를 앞으로 빼며 옆으로 눕고 그쪽 팔로 친다'
  ]::text[],
  array[
    '턱은 끝까지 가슴에 — 뒤통수가 바닥에 닿으면 안 된다',
    '팔은 몸에서 45도쯤 벌려 손바닥과 팔뚝 전체로 친다',
    '손을 짚어 받지 않는다 — 손목 · 팔꿈치가 다친다'
  ]::text[],
  array[
    '테이크다운 · 스윕으로 넘어갈 때 머리 · 손목을 지키는 첫 안전 기술이다',
    '넘어지는 게 무섭지 않아야 서서 하는 연습을 겁 없이 할 수 있다'
  ]::text[],
  array['breakfall','controlled-descent']::text[],
  11
),
(
  'leg-circles', '다리 원 그리기', 'Guard Leg Circles', array['가드 리텐션 드릴','다리 돌리기','힙 스핀'],
  '누워서 엉덩이를 살짝 들고 두 다리로 원을 그려 상대 다리를 따라가는 가드 지키기 드릴',
  array[
    '등을 대고 누워 두 다리를 들어 무릎을 굽힌다',
    '오른다리로 바깥 → 안쪽으로 큰 원을 그린다',
    '왼다리도 같이 — 두 다리가 번갈아 원을 그린다',
    '익숙해지면 등을 축으로 몸을 돌리며 원을 그린다'
  ]::text[],
  array[
    '무릎은 늘 가슴 쪽에 — 다리가 멀어지면 상대가 넘어온다',
    '엉덩이를 살짝 들어 등 위쪽으로 돌아야 빠르다',
    '발끝이 아니라 무릎 · 정강이로 원을 그린다는 느낌'
  ]::text[],
  array[
    '상대가 다리를 돌아 패스하려 할 때 다리를 다시 앞으로 가져오는 가드 리텐션 움직임이다',
    '패스당하기 직전에 막는 게 깔리고 나서 빠지는 것보다 훨씬 쉽다'
  ]::text[],
  array['open-guard-retention','knee-shield-retention','half-guard-recovery']::text[],
  12
)
on conflict (slug) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, aliases = excluded.aliases,
  summary = excluded.summary, steps = excluded.steps, tips = excluded.tips, why = excluded.why,
  related_techniques = excluded.related_techniques, sort_order = excluded.sort_order;

do $$
declare missing text;
begin
  select string_agg(distinct r, ', ') into missing
  from public.drills d, unnest(d.related_techniques) r
  where not exists (select 1 from public.techniques t where t.slug = r and t.owner_id is null);
  if missing is not null then raise exception 'technique not found: %', missing; end if;
end $$;
