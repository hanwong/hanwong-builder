# 포지션 그림 19장 — Higgsfield 웹용 설명문 (T-42, D-52)

## 하는 법
1. higgsfield.ai → 이미지 만들기. 비율은 **1:1(정사각형)**.
2. 아래 **공통 스타일**과 포지션 한 줄을 이어 붙여 넣는다. 예: `공통 스타일` + 줄바꿈 + `closed-guard 설명`.
3. 후보 몇 장 중 **자세가 맞는 것**을 고른다. 팔다리가 엉뚱하거나 사람이 셋이면 버린다.
4. 고른 그림은 **파일 이름을 slug 로** 저장한다(예: `closed-guard.png`, jpg · webp 도 됨). 다운로드 폴더에 두면 된다.
5. 다 모으면(일부만이어도 됨) Claude 에게 "그림 저장했어"라고 말한다. 크기를 줄이고 카드에 연결한다.

## 공통 스타일 (모든 그림 앞에 붙임)
```
Minimal hand-drawn doodle illustration of two Brazilian jiu-jitsu athletes wearing gi, in the style of flat "open peeps" people illustrations. One uniform-weight charcoal black outline (#16160F), flat fills only: one athlete's gi is plain white, the other athlete's gi is filled lime yellow (#DDF542). No shading, no gradients, no text, no letters, no logos, no belts with writing. Skin is not colored: faces, hands and feet are left unfilled in the same off-white as the paper, outline only, no skin tone. Simple faces. Dynamic and energetic, caught mid-movement with leaning bodies and active limbs, like a live roll rather than a static pose. Plain cream background (#FAF9F4) with no floor texture. Both full bodies visible, clear side view, centered with generous empty margin. Square image.
```

## 포지션별 (slug — 화면 이름 — 설명)
| 파일 이름 | 포지션 | 이어 붙일 설명 |
|---|---|---|
| `standing.png` | 스탠딩 · 클린치 | `Both athletes standing face to face, knees slightly bent, each gripping the other's collar and sleeve.` |
| `closed-guard.png` | 클로즈드 가드 | `The lime athlete lies on their back with both legs wrapped around the waist of the white athlete, ankles crossed behind the white athlete's back; the white athlete kneels upright between the legs.` |
| `open-guard.png` | 오픈 가드 | `The lime athlete lies on their back with both feet pressing on the hips of the white athlete, who is kneeling upright; the lime athlete holds both of the white athlete's sleeves.` |
| `butterfly-guard.png` | 버터플라이 가드 | `The lime athlete sits up with both feet hooked inside the white athlete's thighs, one arm under the white athlete's armpit; the white athlete kneels facing them.` |
| `de-la-riva.png` | 데라히바 · 리버스 데라히바 | `The white athlete stands; the lime athlete lies on their back and wraps one leg around the outside of the white athlete's front leg with the foot hooked behind the knee, the other foot pushing the white athlete's hip.` |
| `spider-lasso.png` | 스파이더 · 라쏘 · 소매 가드 | `The white athlete stands; the lime athlete lies on their back holding both of the white athlete's sleeves and presses both feet into the white athlete's biceps.` |
| `lapel-guard.png` | 라펠 가드 | `The white athlete stands; the lime athlete lies on their back holding a long gi lapel that is pulled out and wrapped around the white athlete's leg.` |
| `x-guard.png` | X 가드 · 싱글 레그 X · 앵클락 | `The white athlete stands on one leg, off balance; the lime athlete lies underneath with both legs crossed in an X shape around the white athlete's other leg, hugging that leg.` |
| `half-guard.png` | 하프가드 | `The lime athlete lies on their side on the mat and traps one of the white athlete's legs between both of their legs; the white athlete is on top, chest down, with the lime athlete's arm under their armpit.` |
| `passing.png` | 패스 | `The lime athlete lies on their back with knees up; the white athlete stands over them and pushes both of the lime athlete's knees down to one side, stepping around the legs.` |
| `side-control.png` | 사이드 컨트롤 | `The lime athlete lies flat on their back; the white athlete lies chest-down across the lime athlete's chest at a right angle, knees on the mat beside the lime athlete's hip.` |
| `north-south.png` | 남북 (노스사우스) | `The lime athlete lies flat on their back; the white athlete lies chest to chest on top in the opposite direction, the white athlete's head near the lime athlete's hips.` |
| `knee-on-belly.png` | 니 온 밸리 | `The lime athlete lies flat on their back; the white athlete places one knee on the lime athlete's stomach, the other leg posted out wide, upper body upright.` |
| `kesa-gatame.png` | 곁누르기 | `The lime athlete lies flat on their back; the white athlete sits on the mat at the lime athlete's side, hugging the lime athlete's head and one arm, legs spread wide apart.` |
| `mount.png` | 마운트 | `The lime athlete lies flat on their back; the white athlete sits on the lime athlete's stomach with knees on the mat on both sides.` |
| `back-control.png` | 백 컨트롤 | `Both athletes sit on the mat; the white athlete sits behind the lime athlete with both legs hooked inside the lime athlete's thighs and arms wrapped diagonally across the lime athlete's chest.` |
| `turtle.png` | 터틀 · 크루시픽스 | `The lime athlete is curled up on knees and elbows in a turtle position; the white athlete is on top from the side, chest on the lime athlete's back, gripping around the waist.` |
| `front-headlock.png` | 프론트 헤드락 · 길로틴 | `The lime athlete is on their knees with head down; the white athlete is in front, sprawled with legs back, the lime athlete's head under the white athlete's armpit, arm wrapped around the neck.` |
| `submission-control.png` | 서브미션 자세 | `The lime athlete lies on their back; the white athlete sits at a right angle with both legs across the lime athlete's chest, holding the lime athlete's straightened arm to their own chest (armbar).` |

## 참고
- 2026-10-28 시험 3개(GPT Image 2.5 · 보통 품질) 뒤 본인 의견으로 고침: 피부색 없음(선만), 조금 더 동적으로.
- 모델은 선 그림을 깔끔하게 그리는 것(예: GPT Image · Nano Banana 계열)을 권하지만, 어떤 모델이 나은지는 직접 몇 장 비교해 보는 게 정확하다(미확인).
- 그림은 공유 카드 안에서 184×184 크기로 작게 보인다. 세밀한 것보다 **두 사람 자세가 한눈에 보이는 것**이 중요하다.
- 사람 얼굴 · 실제 선수 · 다른 브랜드 로고가 들어간 그림은 쓰지 않는다.
- 2026-10-28 **만든 결과**: Higgsfield MCP 연결로 GPT Image 2.5(보통 품질 · 1k · 1:1), 포지션마다 후보 2장 → Claude 가 자세가 더 맞는 쪽을 골라 가운데 820px 를 잘라 368px 로 줄임(`src/assets/positions/`). 시험 6장 + 본 38장 = 22 크레딧. 노스사우스는 두 후보 모두 자세가 정확하지 않아 덜 맞는 대로 넣음 — 바꿀 때 이 설명으로 다시 만든다.

