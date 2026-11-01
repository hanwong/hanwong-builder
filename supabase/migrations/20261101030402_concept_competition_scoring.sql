-- 빈 곳 목록(D-104) '시합 점수 · 규정' — 개념 카드 하나. 근거: IBJJF 규정집 v6.1(2024) 3 · 4 · 5조, 반칙 표(2026-11-01 확인).
-- 질문하기가 "스윕 몇 점이에요?"에 답할 수 있게. 규정이 바뀌면 이 카드를 고친다.
insert into public.concepts (slug, name_ko, name_en, kind, summary, body, examples, related_positions, related_techniques, see_also, sort_order)
values (
  'competition-scoring', '시합 점수 (IBJJF)', 'Competition Scoring (IBJJF)', 'learning',
  '테이크다운 · 스윕 · 니 온 밸리 2점, 가드 패스 3점, 마운트 · 백 4점 — 자세를 3초 지켜야 점수',
  array[
    '점수는 자세를 3초 동안 지켜야 준다 — 3초 전에 놓치면 점수 대신 어드밴티지가 될 수 있다',
    '2점: 테이크다운(서서 상대를 등 · 옆 · 엉덩이로 앉히고 위에서 3초) · 스윕(가드 아래에서 뒤집어 위로) · 니 온 밸리',
    '3점: 가드 패스(상대 다리를 지나 사이드 · 남북처럼 옆이나 위에서 누름) · 4점: 마운트 · 백(두 발뒤꿈치 훅을 상대 허벅지 안에)',
    '이어서 얻으면 더한다 — 패스 3 + 마운트 4 = 7점. 같은 자리를 일부러 놓고 다시 잡으면 또 주지 않는다',
    '점수가 같으면 어드밴티지(거의 된 점수 · 진짜 위험했던 서브미션), 그다음 감점 순으로 가린다 · 탭이나 실신은 점수와 상관없이 이긴다',
    '서브미션은 띠마다 허용이 다르다 — 화이트는 하체 관절기 중 스트레이트 풋락만, 토홀드 · 니바 · 카프 슬라이서는 브라운 · 블랙부터, 힐훅은 성인 브라운 · 블랙 노기만'
  ]::text[],
  array[
    '클로즈드 가드에서 시저 스윕으로 넘겨 위에서 3초 — 스윕 2점',
    '하프가드를 빠져나와 사이드 3초(패스 3점) → 그대로 마운트 3초(4점) = 7점',
    '백을 잡았는데 두 다리를 꼬았거나 훅이 하나만 들어갔다 — 점수 없이 어드밴티지',
    '50/50 에서 시작해 50/50 으로 끝나는 스윕 — 어드밴티지도 없다'
  ]::text[],
  array['mount','back-control','knee-on-belly','side-control','passing']::text[],
  array[]::text[],
  array['competition-basics','positional-hierarchy','position-before-submission']::text[],
  (select coalesce(max(sort_order), 0) + 1 from public.concepts where kind = 'learning')
)
on conflict (slug) do update set name_ko = excluded.name_ko, name_en = excluded.name_en, kind = excluded.kind, summary = excluded.summary,
  body = excluded.body, examples = excluded.examples, related_positions = excluded.related_positions,
  related_techniques = excluded.related_techniques, see_also = excluded.see_also;

-- '첫 시합 준비' 카드가 점수 카드를 가리키게
update public.concepts set see_also = array_append(see_also, 'competition-scoring')
 where slug = 'competition-basics' and not ('competition-scoring' = any(see_also));
