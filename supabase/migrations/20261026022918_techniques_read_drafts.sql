-- D-24: 로그인한 사용자는 검수 전 기술(초안)도 읽는다. 앱 화면에는 "검수 전" 을 표시한다.
-- 쓰기 정책은 여전히 없음(콘텐츠는 마이그레이션으로만 바꾼다). 개인 기록 표의 규칙은 그대로.
drop policy if exists "techniques: 검수된 것 보기" on public.techniques;

create policy "techniques: 로그인 보기 (초안 포함)"
  on public.techniques
  for select
  to authenticated
  using (true);
