# bjj-graph 참고 자료 (검수용)
> 출처: daveyarwood/bjj-graph — https://github.com/daveyarwood/bjj-graph (Eclipse Public License 2.0). `src/bjj_graph/v1.clj` 의 포지션 · 기술 이름을 옮겨 적고 한국어 뜻을 붙였다(2026-10-26). 이 저장소는 **Gracie Combatives(그레이시 호신술 커리큘럼) 기반**이라 스포츠 주짓수 체육관과 이름 · 범위가 다르다. 세팅 과정은 없고 "어느 포지션에서 어떤 기술을 쓰면 어디로 가는지"만 있다.

## 어떻게 보면 되나
- 우리 `data/techniques.json` 과 **겹치는 것**은 ✓ 표시 — 이름이 다르면 괄호에 우리 이름.
- 펀치 방어(Punch Block) · 헤드락 탈출처럼 호신술 전용은 우리 목록에 안 넣는다(스포츠 주짓수 수업에서 거의 안 배움).
- 이 파일은 참고용이고 DB 에 들어가지 않는다. 가져다 쓴 이름은 JSON `source` 에 "bjj-graph 참고"로 적으면 된다.

## 포지션(노드) 23개
Standing · Clinch · Rear Clinch · Opponent on Ground · Mount · Modified Mount · S-Mount · Side Mount · Modified Side Mount · Cross-Chest · Reverse Cross-Chest · Knee on Belly · Back Mount · Half Guard · Open Guard · Guard(= 클로즈드 가드) · High-Low Guard · Standing Guillotine · Standing Headlock · Sitting Headlock · Scissor Setup · Twisting Arm Control · Triangle Setup (+ Punch Block Stage 2~5, Triangle Stage 1.5, Triple Threat, Pullback 같은 중간 상태)

## 기술(엣지) — 포지션별
| 시작 포지션 | 기술 (원문) | 뜻 · 우리 목록 |
|---|---|---|
| Standing | Double Leg Takedown | ✓ 더블 레그 테이크다운 |
| Standing | Clinch (Aggressive / Conservative Opponent) | 클린치 진입 — 호신술 |
| Standing | Haymaker Punch Defense · Standing Armlock · Pisão Front Kick · Standing Arm Drag | 호신술 — 제외 |
| Clinch | Body Fold Takedown · Leg Hook Takedown · Inside Trip · Outside Trip | 클린치 테이크다운(안다리 · 밭다리 계열). 우리는 오소토가리 · 세오이나게로 대신 |
| Clinch | Pull Guard | ✓ 가드 풀링 |
| Clinch | Pummel | 언더훅 싸움(퍼멀) — 미포함, 별칭 후보 |
| Rear Clinch | Rear Takedown | 뒤에서 넘기기 — 미포함 |
| Mount | Americana Armlock (Standard / Neck-hug / Side Entry) | ✓ 아메리카나(마운트) |
| Mount | Straight Armlock · Figure-Four Armbar | ✓ 마운트 암바 |
| Mount | Cross Choke | ✓ 크로스 칼라 초크(마운트) |
| Mount | Trap and Roll (Standard / Punch Block / Headlock / Spread Hand) | ✓ 마운트 이스케이프(업파) — "트랩 앤 롤"을 별칭에 추가 추천 |
| Mount | Elbow Escape (Standard / Hook Removal / Fish Hook / Heel Drag) | ✓ 마운트 이스케이프(엘보) |
| Mount | Take the Back · Take the Back (Rider Transition) | 마운트에서 백 테이크 — 미포함(M2 후보) |
| Mount | Headlock Counter · Roll Them Off | 호신술 — 제외 |
| S-Mount | Straight Armlock | S 마운트 암바 — 미포함 |
| Side Mount | Shrimp Escape (Block and Shoot / Shrimp and Shoot / Punch Block) | ✓ 사이드 이스케이프(쉬림프) |
| Side Mount | Elbow Escape (Knee Drive) · Half Guard Recovery | ✓ 하프가드 회복 계열 |
| Side Mount | Mount Transition (Knee Drive / High Step) | ✓ 사이드에서 마운트 가기 |
| Side Mount | Cross-Chest 유지 (Guard Prevention) | ✓ 사이드 컨트롤 유지(크로스페이스) |
| Knee on Belly | (전환만) | ✓ 니 온 밸리 |
| Back Mount | Rear Naked Choke (Weak / Strong Side) | ✓ 리어 네이키드 초크 |
| Back Mount | Remount Technique · Spin Into Their Guard · Frame Escape | 백에서 탈출 · 재마운트 — ✓ 백 이스케이프와 비슷 |
| Twisting Arm Control | Take the Back · Straight Armlock · Forced Back Mount | 마운트 팔 비틀기 컨트롤 — 미포함 |
| Standing Guillotine | Guillotine Choke (Standing / Guard Pull) · Guillotine Defense (Outside Trip) | **길로틴 초크 — 우리 목록에 없음.** 추가 후보 |
| Standing / Sitting Headlock | Headlock Defense · Headlock Escape 1 · 2 | 호신술 — 제외 |
| Scissor Setup | Scissor Choke | 시저 초크(가위 조르기) — 미포함 |
| Half Guard | Tripod Pass | 하프가드 패스 계열 — ✓ 하프가드 패스 |
| Open Guard | Close Guard · Open Guard Pass · Double Underhook Guard Pass | ✓ 더블 언더 패스 |
| Opponent on Ground | Standing Knee Split Pass | ✓ 니슬라이스 패스와 같은 계열("니 스플릿" 별칭 후보) |
| Guard | Kimura Armlock (Rider / Forced / Stage 1.5) | ✓ 기무라(가드) |
| Guard | Straight Armlock (Low / High / Cross Grip / Triangle Transition) | ✓ 클로즈드 가드 암바 |
| Guard | Giant Killer → Triangle Choke | ✓ 트라이앵글 초크 |
| Guard | Elevator Sweep (Standard / Headlock) | 엘리베이터 스윕 — 미포함(버터플라이 훅 스윕과 비슷) |
| Guard | Double Ankle Sweep (Knee Thrust / Kick) | 더블 앵클 스윕 — 미포함. 화이트 벨트 수업에 자주 나오므로 추가 후보 |
| Guard | Hook Sweep | 훅 스윕 — ✓ 버터플라이 스윕 별칭에 있음 |
| Guard | Take the Back · Take the Back (Headlock) | 가드에서 백 테이크 — 미포함 |
| Guard | Knee Split Pass | ✓ 니슬라이스 패스 |
| Guard | Guard Get-Up · Strikes to Open Guard · Punch Block Stage 1~5 · Rollover · Stand Up | 호신술 — 제외 |
| High-Low Guard | → Triangle Setup | 미포함 |

## 우리 목록과 비교해서 보이는 것
- bjj-graph 에 있고 우리에게 **없는 것**: 길로틴 초크, 더블 앵클 스윕, 엘리베이터 스윕, 시저 초크, 마운트 · 가드에서 백 테이크, 트위스팅 암 컨트롤, 클린치 테이크다운(안다리 · 밭다리). 길로틴 · 더블 앵클 스윕은 화이트 벨트 수업에 흔해서 넣을 만하다.
- 우리에게 있고 bjj-graph 에 **없는 것**: 데라히바 · 스파이더 · 라쏘 · 딥 하프 · 니 쉴드 · 토레안도 · 레그 드래그 · 오버 언더 · 보우 앤 애로우 · 오모플라타 · 플라워 · 힙 범프 · 시저 스윕 · 암 트라이앵글 · 터틀 백 테이크. 전부 스포츠 주짓수 체육관에서 흔한 것이라 그대로 둔다.
- 별칭 후보: 업파 ← "트랩 앤 롤", 니슬라이스 ← "니 스플릿 패스", 버터플라이 스윕 ← "훅 스윕"(이미 있음).
