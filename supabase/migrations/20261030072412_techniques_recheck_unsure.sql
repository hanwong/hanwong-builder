-- 확신이 없어 뺐던 후보 110개를 다시 검토해 1개 추가 (D-85). 다른 이름: 같은 동작으로 확인된 후보 24개의 영어 이름. 같은 slug 가 있으면 넣지 않는다.
insert into public.techniques (position_id, slug, name_ko, name_en, aliases, steps, is_reviewed, source, sort_order, kind, role, ends_at, key_points, mistakes, if_blocked, defense)
select p.id, t.slug, t.name_ko, t.name_en, t.aliases, t.steps, false, t.source, t.sort_order, t.kind, t.role, t.ends_at, t.key_points, t.mistakes, t.if_blocked, t.defense
from (values
  ('back-control', 'rear-triangle-to-armbar', '리어 트라이앵글 → 암바', 'Rear Triangle to Armbar', array['백 트라이앵글 암바','리어 트라이앵글 암바','Back Triangle Armbar']::text[], array['리어 트라이앵글(내 오른다리가 상대 오른쪽 어깨 위, 상대 왼팔이 갇힘)에서 상대가 왼팔을 빼려고 버티면 내 양손으로 상대 왼쪽 손목을 잡아 내 가슴으로 당긴다','손목을 놓지 않은 채 엉덩이를 상대 왼쪽 어깨 쪽으로 돌려 내 몸이 상대 몸과 직각이 되게 한다','삼각을 풀고, 상대 목 앞에 있던 내 오른다리를 상대 얼굴 위로 올려 오금으로 얼굴을 누른다','내 왼다리는 상대 가슴 위로 올려 두 무릎을 모으고, 엉덩이를 상대 왼쪽 어깨에 바짝 붙인다','상대 왼손 엄지가 위로 오게 잡고 엉덩이를 천천히 들어 팔꿈치를 편다 — 탭하면 바로 푼다']::text[], 'AI 초안(우리 말로 작성) · 참고: BJJGraph', 26, 'submission', 'top', '{}'::text[], array['양손 손목 그립을 먼저 만들고 나서 삼각을 푼다','내 오른다리 오금으로 상대 얼굴을 눌러 상대가 일어나지 못하게 한다','엉덩이와 상대 왼쪽 어깨 사이에 틈이 없어야 팔꿈치가 펴진다']::text[], array['손목을 잡기 전에 삼각을 풀면 상대가 팔을 빼고 돌아 나간다 → 손목을 두 손으로 잡은 뒤 다리를 푼다','엉덩이가 어깨에서 멀면 당겨도 팔꿈치가 안 펴진다 → 엉덩이를 상대 왼쪽 어깨에 붙인다','오른다리를 얼굴 위에 가볍게 올리기만 하면 상대가 일어나 눌러 온다 → 오금으로 얼굴을 바닥 쪽으로 당겨 누른다']::text[], array['상대가 두 손을 맞잡아 팔을 굽혀 버티면 → 기무라 (백)','상대가 팔을 빼고 엎드리면 → 터틀에서 백 테이크','삼각이 아직 단단하고 상대가 팔을 내주지 않으면 → 리어 트라이앵글']::text[], array['상대가 내 갇힌 왼쪽 손목을 두 손으로 잡고 엉덩이를 돌리기 시작하면 암바 신호다','초반: 내 오른손으로 내 왼손을 맞잡고 왼 팔꿈치를 몸에 붙여 팔을 굽힌 채 지킨다','상대 다리가 얼굴로 넘어왔으면 상대 쪽으로 몸을 돌리며 엄지가 바닥을 향하게 팔을 돌려 뺀다 → 히치하이커 이스케이프','팔꿈치가 이미 펴졌으면 버티지 말고 바로 탭한다']::text[])
) as t(position, slug, name_ko, name_en, aliases, steps, source, sort_order, kind, role, ends_at, key_points, mistakes, if_blocked, defense)
join public.positions p on p.slug = t.position
on conflict (slug) do nothing;

-- 기존 카드와 같은 동작이라 뺀 후보는 영어 이름을 그 카드의 다른 이름으로(검색되게). 이미 있으면 그대로.
update public.techniques set aliases = aliases || array['Crucifix Transition']::text[] where slug = 'back-control-to-crucifix' and owner_id is null and not ('Crucifix Transition' = any(aliases));
update public.techniques set aliases = aliases || array['Standing Switch Defense']::text[] where slug = 'standing-switch' and owner_id is null and not ('Standing Switch Defense' = any(aliases));
update public.techniques set aliases = aliases || array['Guard Pass from Diamond Guard']::text[] where slug = 'break-overhook-guard' and owner_id is null and not ('Guard Pass from Diamond Guard' = any(aliases));
update public.techniques set aliases = aliases || array['Kimura from Diamond Guard']::text[] where slug = 'kimura-guard' and owner_id is null and not ('Kimura from Diamond Guard' = any(aliases));
update public.techniques set aliases = aliases || array['Overhook Strip from Diamond Guard']::text[] where slug = 'break-overhook-guard' and owner_id is null and not ('Overhook Strip from Diamond Guard' = any(aliases));
update public.techniques set aliases = aliases || array['Transition to Diamond Guard']::text[] where slug = 'closed-guard-to-overhook-guard' and owner_id is null and not ('Transition to Diamond Guard' = any(aliases));
update public.techniques set aliases = aliases || array['Backstep from K-Guard']::text[] where slug = 'pass-k-guard' and owner_id is null and not ('Backstep from K-Guard' = any(aliases));
update public.techniques set aliases = aliases || array['Omoplata from Russian Leg Lasso']::text[] where slug = 'omoplata-from-lasso' and owner_id is null and not ('Omoplata from Russian Leg Lasso' = any(aliases));
update public.techniques set aliases = aliases || array['Pass Russian Leg Lasso']::text[] where slug = 'lasso-guard-pass' and owner_id is null and not ('Pass Russian Leg Lasso' = any(aliases));
update public.techniques set aliases = aliases || array['Russian Lasso Sweep']::text[] where slug = 'lasso-sweep' and owner_id is null and not ('Russian Lasso Sweep' = any(aliases));
update public.techniques set aliases = aliases || array['Pass Inverted Lasso Guard']::text[] where slug = 'lasso-guard-pass' and owner_id is null and not ('Pass Inverted Lasso Guard' = any(aliases));
update public.techniques set aliases = aliases || array['Stack from Inverted Lasso']::text[] where slug = 'lasso-guard-stack-pass' and owner_id is null and not ('Stack from Inverted Lasso' = any(aliases));
update public.techniques set aliases = aliases || array['Half Guard to K-Guard']::text[] where slug = 'k-guard' and owner_id is null and not ('Half Guard to K-Guard' = any(aliases));
update public.techniques set aliases = aliases || array['Pass Pocket Half']::text[] where slug = 'smash-pass' and owner_id is null and not ('Pass Pocket Half' = any(aliases));
update public.techniques set aliases = aliases || array['Pocket Half Pass']::text[] where slug = 'smash-pass' and owner_id is null and not ('Pocket Half Pass' = any(aliases));
update public.techniques set aliases = aliases || array['Smash Pocket Half']::text[] where slug = 'smash-pass' and owner_id is null and not ('Smash Pocket Half' = any(aliases));
update public.techniques set aliases = aliases || array['Backstep from Leg Weave']::text[] where slug = 'complete-leg-weave-pass' and owner_id is null and not ('Backstep from Leg Weave' = any(aliases));
update public.techniques set aliases = aliases || array['Short Choke Attack']::text[] where slug = 'short-choke' and owner_id is null and not ('Short Choke Attack' = any(aliases));
update public.techniques set aliases = aliases || array['Bridge from Ushiro Kesa Gatame']::text[] where slug = 'escape-ushiro-kesa-gatame' and owner_id is null and not ('Bridge from Ushiro Kesa Gatame' = any(aliases));
update public.techniques set aliases = aliases || array['Kesa Gatame Arm Crush from Kesa Gatame']::text[] where slug = 'kesa-straight-armlock' and owner_id is null and not ('Kesa Gatame Arm Crush from Kesa Gatame' = any(aliases));
update public.techniques set aliases = aliases || array['Kimura from Kuzure Kesa Gatame']::text[] where slug = 'kimura-from-kesa' and owner_id is null and not ('Kimura from Kuzure Kesa Gatame' = any(aliases));
update public.techniques set aliases = aliases || array['Matrix Back Take']::text[] where slug = 'rolling-back-take' and owner_id is null and not ('Matrix Back Take' = any(aliases));
update public.techniques set aliases = aliases || array['Matrix to Back Control']::text[] where slug = 'rolling-back-take' and owner_id is null and not ('Matrix to Back Control' = any(aliases));
update public.techniques set aliases = aliases || array['Chin Strap Guillotine from Front Headlock']::text[] where slug = 'guillotine-setup' and owner_id is null and not ('Chin Strap Guillotine from Front Headlock' = any(aliases));
