-- 점검(advisors) 결과 반영: ① RLS 의 auth.uid() 를 (select auth.uid()) 로 — 행마다 다시 계산하지 않게 ② 외래키 인덱스 4개
-- 정책 의미는 DB.md 5장 표와 똑같다. 바뀌는 건 성능뿐.

-- ① 정책 다시 만들기
drop policy "class_logs: 자기 것 보기" on public.class_logs;
drop policy "class_logs: 자기 것 추가" on public.class_logs;
drop policy "class_logs: 자기 것 수정" on public.class_logs;
drop policy "class_logs: 자기 것 삭제" on public.class_logs;
create policy "class_logs: 자기 것 보기" on public.class_logs for select to authenticated using (user_id = (select auth.uid()));
create policy "class_logs: 자기 것 추가" on public.class_logs for insert to authenticated with check (user_id = (select auth.uid()));
create policy "class_logs: 자기 것 수정" on public.class_logs for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "class_logs: 자기 것 삭제" on public.class_logs for delete to authenticated using (user_id = (select auth.uid()));

drop policy "clt: 자기 것 보기" on public.class_log_techniques;
drop policy "clt: 자기 것 추가" on public.class_log_techniques;
drop policy "clt: 자기 것 삭제" on public.class_log_techniques;
create policy "clt: 자기 것 보기" on public.class_log_techniques for select to authenticated using (user_id = (select auth.uid()));
create policy "clt: 자기 것 추가" on public.class_log_techniques for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.class_logs l where l.id = class_log_id and l.user_id = (select auth.uid())));
create policy "clt: 자기 것 삭제" on public.class_log_techniques for delete to authenticated using (user_id = (select auth.uid()));

drop policy "levels: 자기 것 보기" on public.technique_levels;
drop policy "levels: 자기 것 추가" on public.technique_levels;
drop policy "levels: 자기 것 수정" on public.technique_levels;
drop policy "levels: 자기 것 삭제" on public.technique_levels;
create policy "levels: 자기 것 보기" on public.technique_levels for select to authenticated using (user_id = (select auth.uid()));
create policy "levels: 자기 것 추가" on public.technique_levels for insert to authenticated with check (user_id = (select auth.uid()));
create policy "levels: 자기 것 수정" on public.technique_levels for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "levels: 자기 것 삭제" on public.technique_levels for delete to authenticated using (user_id = (select auth.uid()));

drop policy "cards: 자기 것 보기" on public.review_cards;
drop policy "cards: 자기 것 추가" on public.review_cards;
drop policy "cards: 자기 것 수정" on public.review_cards;
drop policy "cards: 자기 것 삭제" on public.review_cards;
create policy "cards: 자기 것 보기" on public.review_cards for select to authenticated using (user_id = (select auth.uid()));
create policy "cards: 자기 것 추가" on public.review_cards for insert to authenticated with check (user_id = (select auth.uid()));
create policy "cards: 자기 것 수정" on public.review_cards for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "cards: 자기 것 삭제" on public.review_cards for delete to authenticated using (user_id = (select auth.uid()));

drop policy "rlogs: 자기 것 보기" on public.review_logs;
drop policy "rlogs: 자기 것 추가" on public.review_logs;
create policy "rlogs: 자기 것 보기" on public.review_logs for select to authenticated using (user_id = (select auth.uid()));
create policy "rlogs: 자기 것 추가" on public.review_logs for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.review_cards c where c.id = review_card_id and c.user_id = (select auth.uid())));

-- ② 외래키 인덱스
create index clt_technique_idx          on public.class_log_techniques (technique_id);
create index review_cards_technique_idx on public.review_cards (technique_id);
create index review_logs_card_idx       on public.review_logs (review_card_id);
create index technique_levels_technique_idx on public.technique_levels (technique_id);
