-- 운영 화면에서 추가돼 JSON 에 없던 4개도 오른손잡이 기준 좌우 명시(D-74). 그사이 또 고쳤으면 건드리지 않는다.
update public.techniques set steps = array[
  '상대가 등을 돌려 앉으면 상대 왼쪽 뒤에 엉덩이를 대고 앉는다',
  '내 오른다리를 상대 두 다리 사이로 넣어 오른발 발등을 상대 오른쪽 허벅지 안쪽에 건다',
  '내 왼다리로 상대 왼쪽 허벅지를 바깥에서 감아 상대 왼다리를 두 다리 사이에 묶는다',
  '내 오른손으로 상대 띠 뒤쪽을 잡고 왼팔로 상대 왼쪽 엉덩이를 감싸 가슴을 등에 붙인다',
  '상대가 앞으로 나가면 띠를 당겨 내 다리 위로 앉히고 백으로, 버티면 옆으로 눕혀 사이드로 간다'
]::text[] where slug = 'crab-ride' and owner_id is null and steps[1] = '가드를 등지고 돌아선 상대의 뒤쪽 옆에 무릎을 대고 앉는다';
update public.techniques set steps = array[
  '상대 오른다리를 내 두 다리 사이에 끼운 리버스 하프가드를 만든다(내 왼쪽 어깨가 바닥)',
  '내 왼손으로 상대 오른쪽 발목을 잡고 오른손으로 바닥을 짚어 몸을 세운다',
  '내 오른다리를 상대 오른쪽 무릎 뒤에 걸어 상대 중심을 뒤로 뺏는다',
  '내 왼다리로 끼운 다리를 밀며 엉덩이를 돌려 상대를 상대 오른쪽 뒤로 넘긴다',
  '상대가 넘어가면 따라 올라가 사이드 컨트롤을 잡는다'
]::text[] where slug = 'fishnet-sweep-from-reverse-half-guard' and owner_id is null and steps[1] = '상대 다리를 두 다리 사이에 끼운 리버스 하프가드 자세를 만든다';
update public.techniques set steps = array[
  '상대가 뒤집히기 시작하면 한 걸음 물러나 거리를 만든다',
  '내 양손으로 상대 양 무릎 바깥쪽을 잡는다',
  '상대 두 다리를 상대 왼쪽(내 오른쪽)으로 눌러 골반 방향을 돌린다',
  '내 왼쪽으로 크게 한 걸음 돌아 상대 오른쪽 엉덩이 옆으로 간다',
  '가슴을 붙여 상대 오른쪽에서 사이드 컨트롤을 잡는다'
]::text[] where slug = 'inverted-guard-pass' and owner_id is null and steps[1] = '상대가 뒤집히기 시작하면 한 걸음 물러나 거리를 만든다' and steps[3] = '상대 다리를 한쪽 옆으로 눌러 골반 방향을 돌린다';
update public.techniques set steps = array[
  '상대 오른다리를 내 두 다리 사이에 둔 채 몸을 내 왼쪽으로 돌려 왼쪽 어깨를 바닥에 댄다',
  '내 왼다리로 상대 오른다리 안쪽을 감아 건다',
  '내 오른발로 상대 오른쪽 골반이나 허벅지를 민다',
  '내 왼손으로 상대 오른쪽 발목을, 오른손으로 오른쪽 무릎을 잡아 거리를 유지한다',
  '상대 오른다리를 끌며 피쉬넷이나 스윕으로 이어 간다'
]::text[] where slug = 'reverse-half-guard-45bdd4' and owner_id is null and steps[1] = '상대 쪽으로 몸을 돌려 어깨를 바닥에 댄다';
