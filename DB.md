# DB.md — Re:Re:롤 저장할 데이터 (M1)
> 3단계 산출물. 2026-10-26 설계. FLOW.md 화면 7개와 DECISIONS D-04 · D-06 · D-09 를 따른다. Supabase Postgres, 변경은 마이그레이션 파일로만.

## 0. 어디에 저장하나
- **Supabase(서버)** 에 저장한다. 이유: 기록 · 카드는 휴대폰과 PC 어디서 열어도 같아야 하고, 본인만 보도록 로그인과 접근 규칙이 필요하다.
- 브라우저에만 두는 것: 없음(로그인 세션은 Supabase 가 알아서).

## 1. 로그인
- 누가: **수련자**만. 랜딩(`/`)은 로그인 없이, `/app/...` 전부 로그인 필요(D-07).
- 벨트 색(홈 수련 벨트, D-33)은 표를 만들지 않고 `auth.users` 의 `user_metadata.belt`(white · blue · purple · brown · black)에 둔다. 본인만 바꾼다(supabase.auth.updateUser).
- 방식: **Supabase Auth + Google**(D-05). 이메일 · 매직링크 없음. 사용자 식별은 `auth.users.id`(uuid) — 아래 표의 `user_id` 가 이것을 가리킨다.
- 운영자(본인): `operators` 표에 한웅 님 계정 하나(D-47). 운영 화면 `/app/admin` 에서 목록 밖 기술 초안을 승인 · 버림. 그 밖의 기술 콘텐츠는 마이그레이션으로 넣는다.
- 참고: Google 로그인은 Google Cloud 에서 OAuth 클라이언트를 만들어 Supabase 에 넣어야 한다(T-00b). 메일 발송 한도 문제는 없다.

## 2. 표 목록 (12개)
| 표 | 한 줄 설명 | 누구 데이터 |
|---|---|---|
| `positions` | 포지션 8개(스탠딩 · 클로즈드 가드 · 오픈 가드 · 하프가드 · 패스 · 사이드 · 마운트 · 백). 기술을 묶는 상자 | 콘텐츠(공용) |
| `techniques` | 기술 — 이름 · 별칭 · 세팅 과정 · 검수 여부. 복습 카드 뒷면의 재료. 사용자가 만든 '내 기술'(D-57)은 승인 전까지 만든 사람만 | 콘텐츠(공용) · 내 기술 |
| `class_logs` | 오늘 배운 것 기록 — 날짜 · 글 원문 · 용어 요약 | 사용자 |
| `class_log_techniques` | 기록 한 건에 어떤 기술이 뽑혔나(여러 개). "목록에 없음" 기술은 이름만 | 사용자 |
| `technique_levels` | 기술별 내 숙련도(비기너 · 초보 · 중급 · 고급 · 프로) | 사용자 |
| `review_cards` | 기술당 복습 카드 1장 — 간격 단계 · 다음 복습일 — **D-58(2026-10-29) 뒤로 앱이 읽거나 쓰지 않는다. 내용은 보관만(되살릴 때 씀)** | 사용자 |
| `review_logs` | 카드를 풀 때마다 남는 응답(다시 · 어려움 · 보통 · 쉬움) — **D-58(2026-10-29) 뒤로 앱이 읽거나 쓰지 않는다. 내용은 보관만(되살릴 때 씀)** | 사용자 |
| `ai_calls` | AI 호출을 언제 했나 — kind `organize` 정리하기(D-43, D-56 으로 없앰) · `redraft` 운영자 다시 추천 · `user_draft` 내용 생성(**하루 3번**, D-57) | 사용자 |
| `operators` | 운영자 계정(한웅 님 하나, D-47) | 운영 |
| `technique_drafts` | 기록에 직접 적힌 이름 → AI 초안(새 기술 · 다른 이름 · 기술 아님) · 승인 대기/승인/버림(D-47) | 운영 |
| `notices` | 사용자 알림 — "○○ 이(가) 기술 목록에 추가됐어요"(D-47) | 사용자 |
| `technique_suggestions` | 사용자가 보낸 기술 내용 보완 제안(세팅 과정 · 다른 이름 · 이유) → 운영자 승인(D-50) | 사용자 · 운영 |

## 3. 표별 칸
공통: 모든 표에 `id uuid 기본키(자동)`, `created_at timestamptz 기본값 now()`. 사용자 표에는 `user_id uuid → auth.users(id)` 필수.

### `positions`
| 칸 | 종류 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | ✓ | 자동 | |
| slug | text | ✓ | | 영문 키(`half-guard`). 유일 |
| name_ko | text | ✓ | | 한국어 이름(하프가드) |
| name_en | text | ✓ | | 영어 이름 |
| sort_order | int | ✓ | 0 | 화면 순서 |
| created_at | timestamptz | ✓ | now() | |

### `techniques`
| 칸 | 종류 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | ✓ | 자동 | |
| position_id | uuid → positions | ✓ | | 어느 포지션 |
| slug | text | ✓ | | 영문 키(`de-la-riva-guard`). 유일 |
| name_ko | text | ✓ | | 한국어 이름(데라히바 가드) |
| name_en | text | ✓ | | 영어 이름 |
| aliases | text[] | | `{}` | 별칭(체육관마다 다른 이름 · 줄임말) |
| steps | text[] | ✓ | | 세팅 과정 3~5줄, 순서대로 |
| is_reviewed | boolean | ✓ | false | 본인 검수 끝남(D-04). false 면 앱에 "검수 전" 표시(D-24, 처음엔 숨김이었음) |
| source | text | | | 뼈대 출처 표기(예: bjj-graph, EPL-2.0) |
| sort_order | int | ✓ | 0 | 포지션 안 순서 |
| owner_id | uuid → auth.users | | | **비면 공용.** 있으면 그 사람이 '내용 생성'으로 만든 내 기술(D-57) — 만든 사람 · 운영자만 보임. 계정을 지우면 같이 지움 |
| owner_status | text | | | owner_id 가 있을 때만: `pending` 승인 대기 · `rejected` 버림(만든 사람에게 계속 보임). 승인하면 owner_id · owner_status 모두 비고 공용 |
| created_at | timestamptz | ✓ | now() | |

### `class_logs`
| 칸 | 종류 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | ✓ | 자동 | |
| user_id | uuid → auth.users | ✓ | | 누구 것 |
| logged_on | date | ✓ | 오늘(서울) | 수업 날짜. 서버에서 Asia/Seoul 로 계산해 넣음 |
| body | text | ✓ | | 오늘 메모(음성 입력 포함, 0~5000자). D-56 부터 선택 — 기술만 고르면 빈 글. 기술도 메모도 없으면 앱이 막음. 상대 이름은 적지 말라고 화면에 안내 |
| terms | jsonb | | `[]` | 용어 요약 `[{term, meaning}]` — AI 가 쓴 것, 읽기용. D-56 뒤 새 기록은 비어 있음 |
| ai_status | text | ✓ | `'none'` | `mock` · `ok` · `failed` · `none`(그냥 저장) |
| created_at | timestamptz | ✓ | now() | |

### `class_log_techniques`
| 칸 | 종류 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | ✓ | 자동 | |
| user_id | uuid → auth.users | ✓ | | (접근 규칙용, class_logs 와 같은 값) |
| class_log_id | uuid → class_logs | ✓ | | 어느 기록. 기록 지우면 같이 지움 |
| technique_id | uuid → techniques | | | 검수된 목록의 기술. "목록에 없음" 이면 비움 |
| custom_name | text | | | 목록에 없는 기술 이름(직접 적음). technique_id 가 비면 필수 |
| created_at | timestamptz | ✓ | now() | |

### `technique_levels`
| 칸 | 종류 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | ✓ | 자동 | |
| user_id | uuid → auth.users | ✓ | | |
| technique_id | uuid → techniques | ✓ | | |
| level | text | ✓ | `'beginner'` | `beginner` 비기너 · `novice` 초보 · `intermediate` 중급 · `advanced` 고급 · `pro` 프로 |
| updated_at | timestamptz | ✓ | now() | |
| created_at | timestamptz | ✓ | now() | |

### `review_cards`
| 칸 | 종류 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | ✓ | 자동 | |
| user_id | uuid → auth.users | ✓ | | |
| technique_id | uuid → techniques | ✓ | | 카드 1장 = 기술 1개 |
| interval_step | int | ✓ | 0 | 0=1일 · 1=3일 · 2=7일 · 3=14일 · 4=30일 (D-09) |
| due_on | date | ✓ | 내일(서울) | 다음 복습일. 서버에서 Asia/Seoul 로 계산 |
| reviews_count | int | ✓ | 0 | 지금까지 푼 횟수 |
| last_reviewed_at | timestamptz | | | |
| created_at | timestamptz | ✓ | now() | |

### `review_logs`
| 칸 | 종류 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | ✓ | 자동 | |
| user_id | uuid → auth.users | ✓ | | |
| review_card_id | uuid → review_cards | ✓ | | 카드 지우면 같이 지움 |
| rating | text | ✓ | | `again` 다시 · `hard` 어려움 · `good` 보통 · `easy` 쉬움 |
| prev_step | int | ✓ | | 누르기 전 단계 |
| next_step | int | ✓ | | 누른 뒤 단계 |
| reviewed_at | timestamptz | ✓ | now() | |
| created_at | timestamptz | ✓ | now() | |

### `ai_calls` (D-43)
| 칸 | 종류 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| id | uuid | ✓ | 자동 | |
| user_id | uuid → auth.users | ✓ | | 누가 |
| kind | text | ✓ | `'organize'` | 무엇을(지금은 정리하기 하나) |
| called_at | timestamptz | ✓ | now() | 언제. 월요일 00:00(서울)부터 세어 3번이면 그 주는 막는다 |
| created_at | timestamptz | ✓ | now() | |
- 글 내용 · 결과는 넣지 않는다(횟수만). 연습용 예시(mock)일 때는 기록하지 않는다. 실패한 호출도 세지 않는다.

### `operators` (D-47)
| 칸 | 종류 | 필수 | 설명 |
|---|---|---|---|
| user_id | uuid → auth.users (기본키) | ✓ | 운영자 계정. 마이그레이션으로만 넣는다 |
| created_at | timestamptz | ✓ | |

### `technique_drafts` (D-47)
| 칸 | 종류 | 필수 | 설명 |
|---|---|---|---|
| id | uuid | ✓ | |
| name_key | text 유일 | ✓ | 적힌 이름에서 띄어쓰기 지우고 소문자(`public.name_key()`) — 같은 이름은 초안 하나 |
| custom_name | text | ✓ | 사용자가 적은 이름(대표 하나, 1~100자) |
| kind | text | ✓ | `new` 새 기술 · `alias` 있는 기술의 다른 이름 · `unclear` 기술 아님 같음 |
| alias_of | uuid → techniques | | kind=alias 일 때 붙일 기술 |
| position_id | uuid → positions | | |
| slug · name_ko · name_en | text | | 새 기술 칸(승인 때 필수) |
| aliases · steps | text[] | ✓ | 다른 이름 · 세팅 과정(승인 때 3~5줄) |
| note | text | | AI 가 그렇게 본 이유 한 줄 |
| status | text | ✓ | `pending` · `approved` · `rejected` |
| technique_id | uuid → techniques | | 승인 뒤 연결된 기술 |
| decided_at · created_at | timestamptz | | |
- 운영자가 이름을 누를 때 그 이름 하나만 초안을 만든다(D-49). Claude 에는 이름만 보낸다(글 원문 · 누가 적었는지 없음). 하루 20개까지(오늘 만든 초안 + `ai_calls` 의 redraft 로 센다, D-48).

### `technique_suggestions` (D-50)
| 칸 | 종류 | 필수 | 설명 |
|---|---|---|---|
| id | uuid | ✓ | |
| user_id | uuid → auth.users | ✓ | 보낸 사람(알림 · 계정 삭제용). 운영 화면에는 안 보임. 계정 지우면 같이 지움 |
| technique_id | uuid → techniques | ✓ | 어느 기술 |
| steps | text[] | ✓ | 제안한 세팅 과정 전체 3~5줄 |
| add_aliases | text[] | ✓ | 더할 다른 이름(최대 5) |
| reason | text | | 이유 한 줄(최대 200자) |
| status | text | ✓ | `pending` · `approved` · `rejected` |
| decided_at · created_at | timestamptz | | |
- 한 사람 · 한 기술에 대기 제안 1개(유일 인덱스), 한 사람 대기 10개까지(정책 + `my_pending_suggestions()`). 승인은 `approve_technique_suggestion(id, 최종 steps, 더할 aliases)` — 운영자 확인 후 기술에 반영(다른 이름은 더하기만) · 보낸 사람 알림.

### `notices` (D-47)
| 칸 | 종류 | 필수 | 설명 |
|---|---|---|---|
| id | uuid | ✓ | |
| user_id | uuid → auth.users | ✓ | 받는 사람. 계정 지우면 같이 지움 |
| message | text | ✓ | 1~200자 |
| technique_id | uuid → techniques | | 누르면 그 기술 상세로 |
| read_at | timestamptz | | "확인" 누른 때. 비었으면 홈에 보인다 |
| created_at | timestamptz | ✓ | |

## 4. 관계
- `techniques.position_id → positions.id` — 포지션은 지우지 않는다(기술이 있으면 막음).
- `class_log_techniques.class_log_id → class_logs.id` — **기록을 지우면 연결도 같이 지움**(cascade).
- `class_log_techniques.technique_id → techniques.id` — 기술은 지우지 않는다(연결이 있으면 막음).
- `technique_levels` · `review_cards` → `techniques` — 같음(막음).
- `review_logs.review_card_id → review_cards.id` — **카드를 지우면 응답도 같이 지움**(cascade).
- 모든 사용자 표 `user_id → auth.users.id` — **계정을 지우면 그 사람 데이터 전부 같이 지움**(cascade).

## 5. 누가 읽고 쓰나 (= 접근 규칙 RLS)
| 표 | 로그인 안 한 사람 | 로그인한 본인 | 다른 사용자 | 운영자(앱 안) |
|---|---|---|---|---|
| positions | ✗ | 보기 | 보기 | 보기 (쓰기는 마이그레이션 · 시드로만) |
| techniques | ✗ | 공용 보기(검수 전 초안 포함, D-24) + **내가 만든 것 보기 · 추가**(승인 대기 · 검수 전으로만, D-57) | 공용만 (남이 만든 것 ✗) | 전부 보기, 사용자 기술 승인 · 버림은 함수로 (공용 쓰기는 마이그레이션 · 시드로만) |
| class_logs | ✗ | 보기 · 추가 · 수정 · 삭제 (자기 것만) | ✗ | ✗ |
| class_log_techniques | ✗ | 보기 · 추가 · 삭제 (자기 것만) | ✗ | ✗ |
| technique_levels | ✗ | 보기 · 추가 · 수정 · 삭제 (자기 것만) | ✗ | ✗ |
| review_cards | ✗ | 보기 · 추가 · 수정 · 삭제 (자기 것만) | ✗ | ✗ |
| review_logs | ✗ | 보기 · 추가 (자기 것만) | ✗ | ✗ |
| ai_calls | ✗ | 보기 · 추가 (자기 것만, 수정 · 삭제 없음) | ✗ | ✗ |
| operators | ✗ | 자기 줄만 보기 | ✗ | 자기 줄만 보기 (추가는 마이그레이션으로만) |
| technique_drafts | ✗ | ✗ | ✗ | 보기 · 추가 · 수정 (삭제 없음) |
| notices | ✗ | 보기 · 확인(read_at 수정) (자기 것만) | ✗ | ✗ (추가는 승인 함수만) |
| technique_suggestions | ✗ | 보기 · 보내기 (자기 것만, 대기 10개까지 · 수정 · 삭제 없음) | ✗ | 보기 · 버림(status 수정), 승인은 함수로 |
- "자기 것만" = `user_id = auth.uid()`. 운영자 역할은 앱에 없다 — 본인도 앱에서는 자기 기록만 본다. 다른 사람 기록은 Supabase 대시보드(관리자)에서만 보이고, 그건 사용자 테스트 전에 "볼 사람 · 삭제 시점" 을 안내한다(PLAN 미정 10).
- 한 줄 답: **이 표대로면 다른 사용자가 내 데이터를 볼 수 없다.** 공용인 건 기술 콘텐츠뿐이다.
- **사용자 기술 함수(D-57, 운영자만)**: `approve_user_technique(id, position, name_ko, name_en, steps)` 고친 내용으로 공용 기술 + 만든 사람에게 알림 · `reject_user_technique(id)` 버림(owner_status = rejected). 앱의 공용 목록 캐시는 `owner_id is null` 만 읽고, 내 기술은 사람마다 따로 읽는다(남의 내 기술이 캐시로 새지 않게). 기술을 가리키는 연결 · 숙련도 · 카드의 외래키는 restrict → no action(계정 삭제 때 같은 문장 안에서 함께 지워지게, 평소엔 똑같이 막음).
- **운영자 DB 함수(D-47, security definer — 함수 안에서 운영자인지 먼저 확인, 아니면 거부 42501)**: `is_operator()` 운영자인가 · `pending_custom_names()` 초안 없는 적힌 이름과 횟수 · 사람 수(글 원문 · 사람 정보 없음) · `custom_name_counts(keys)` 초안별 횟수 · `approve_technique_draft(draft, due)` 승인 → 기술 추가(또는 다른 이름 추가) · 그 이름으로 적힌 모든 기록 연결 · 숙련도(비기너) · 카드(due) · 알림. 운영자도 다른 사람의 기록 표를 직접 읽지는 못한다(점검 2026-10-28: 0건). Supabase 보안 점검이 이 4개 함수를 "로그인 사용자가 실행 가능"으로 경고하지만 의도된 것 — 비운영자 · 로그인 안 한 사람 호출은 모두 막힘 확인.

## 6. 제약 · 인덱스 (함정 대비)
- `review_cards (user_id, technique_id)` **유일** — 같은 기술을 두 번 기록해도 카드 1장.
- `technique_levels (user_id, technique_id)` 유일.
- `class_log_techniques (class_log_id, technique_id)` 유일(technique_id 가 있을 때) + `technique_id 또는 custom_name 중 하나는 반드시` 체크.
- `techniques.slug`, `positions.slug` 유일.
- `review_cards.interval_step` 0~4, `technique_levels.level` 5개 값, `review_logs.rating` 4개 값, `class_logs.ai_status` 4개 값 — 체크 제약.
- 인덱스: `ai_calls (user_id, called_at)` — 이번 주 횟수. `review_cards (user_id, due_on)` — "오늘 복습" 조회. `class_logs (user_id, logged_on desc)` — 최근 기록. `class_log_techniques (user_id, technique_id)` — 기술 상세의 "내 기록 모음". `techniques (position_id, sort_order)`.
- **날짜는 전부 Asia/Seoul** — `logged_on`, `due_on` 은 서버 코드에서 서울 기준 날짜를 계산해 넣는다(DB 기본값 `current_date` 는 UTC 라 쓰지 않음). 밤 9시 이후 기록이 하루 어긋나지 않게.
- **매칭 결과는 `techniques.id` 만** — 서버가 Claude 에서 slug(고유 키) 배열을 받아 후보에 있는 것만 남기고(없는 건 버림), 저장할 때 id 로 바꾼다. 후보는 `is_reviewed = true` 인 것, 단 검수된 기술이 20개 전이면 초안 포함(D-21). 초안 기술도 저장 · 복습 카드가 된다(D-24). 이름 문자열은 저장하지 않는다(custom_name 은 사용자가 직접 적은 것만).
- **복습 간격 규칙(D-09, 안키식)**: 단계 `[1, 3, 7, 14, 30]`일. 새 카드 = 단계 0, 다음 복습 = 내일. `again` → 단계 0 · 내일 / `hard` → 단계 유지 / `good` → +1 / `easy` → +2 (최대 4). 다음 복습일 = 오늘(서울) + 그 단계의 일수. 계산은 서버 코드(DB 함수 아님).

## 7. 개인정보
| 칸 | 민감한가 | 꼭 필요한가 |
|---|---|---|
| 이메일 · 이름 · 프로필 사진 | Google 이 주는 것. `auth.users` 에만 있고 **우리 표로 복사하지 않는다** | 로그인 식별에만. 화면엔 안 띄움(M1) |
| `class_logs.body` 글 원문 | 사용자가 **상대 이름**을 적을 수 있다 | 글 자체는 핵심. 화면에 "상대 이름은 적지 마세요(벨트 · 체급만)" 안내. 서버로 보내는 것도 이 글뿐(Claude) |
| 위치 · 연락처 · 사진 · 생년월일 | 안 모은다 | — |

## 8. 파일 (Storage)
- M1 에는 없음. 기술 그림 · 사진 · 녹음 전부 M2 이후. 저장 공간을 만들지 않는다.

## 9. 시드 데이터
- `positions` 8개: 스탠딩, 클로즈드 가드, 오픈 가드, 하프가드, 패스, 사이드 컨트롤, 마운트, 백 컨트롤.
- `techniques` 10개(예시 · **전부 `is_reviewed = false` 초안**, 세팅 과정은 AI 초안 — 본인 검수 전엔 앱에서 숨김): 데라히바 가드 · 클로즈드 가드 암바 · 트라이앵글 초크 · 시저 스윕 · 니슬라이스 패스 · 토레안도 패스 · 사이드 이스케이프(힙 이스케이프) · 마운트 이스케이프(업파) · 리어 네이키드 초크 · 하프가드 언더훅 스윕. 이름 · 별칭 · 과정은 마이그레이션 시드 SQL 로, 이후 `data/techniques.json`(원본) → `scripts/techniques-to-sql.mjs` 가 positions · techniques upsert SQL 을 만들어 새 마이그레이션으로 적용한다. 2026-10-27 현재 **포지션 19개 · 기술 573개**(2차 검토 D-46 · 케이 가드 D-32). **2026-10-28 부터 원본은 DB**(D-47) — 운영 화면에서 승인한 기술이 DB 에 바로 들어가므로, JSON 을 고치기 전에 `scripts/techniques-from-db.mjs` 로 받아 온다, 전부 세팅 과정 3~4줄 · `is_reviewed=true`(D-14 · D-15 · D-29 — 본인 결정으로 전부 검수됨 처리). 기술마다 `source` 에 참고 자료 위치를 적는다.
- 사용자 데이터(기록 · 카드)는 시드하지 않는다 — 개발 계정에 앱으로 직접 넣는다(T-13). 가짜 사람 정보 없음.

## 10. 접근 점검 결과 (2026-10-26)
### 만든 것
- 마이그레이션 2개 적용: `20261025152027_rereroll_m1.sql`(표 7 · 제약 · RLS · 시드), `20261025153000_rls_perf.sql`(RLS 성능 수정 · 외래키 인덱스 4). `npx supabase db push` 성공.
- 확인: 포지션 8, 기술 10(검수 0 → 앱에선 숨김), RLS 켜진 표 7, 정책 19개.
- 타입 파일: `src/lib/database.types.ts` (`gen types typescript --linked`).
- 보안 점검(advisors security): **경고 0.** 성능 점검: `auth_rls_initplan` 경고 17개 → `(select auth.uid())` 로 고쳐 0. 외래키 인덱스 없음 4개 → 추가. 남은 건 "아직 안 쓰인 인덱스" INFO 9개 — 새 DB 라 당연, 그대로 둠.

### 접근 점검 — 테스트 사용자 A · B (DB 안에서 역할을 바꿔 실행, 끝에 전부 롤백 · 계정 삭제 확인)
| # | 점검 | 결과 |
|---|---|---|
| 1 | A 가 미검수 기술을 못 본다 | ✓ |
| 2 | A 가 포지션 8개를 본다 | ✓ |
| 3 | A 가 자기 기록을 수정한다 | ✓ |
| 4 | A 가 자기 기록을 본다 | ✓ |
| 5 | 같은 기술 카드를 두 장 못 만든다(유일 제약) | ✓ |
| 6 | A 가 B 이름으로 기록을 추가할 수 없다 | ✓ |
| 7~11 | B 가 A 의 기록 · 기술 연결 · 숙련도 · 카드 · 응답을 못 본다 | ✓ |
| 12 | B 가 A 기록을 수정할 수 없다 | ✓ |
| 13 | B 가 A 기록을 삭제할 수 없다 | ✓ |
| 14 | B 가 A 기록에 기술을 붙일 수 없다 | ✓ |
| 15 | 로그인 안 한 사람이 기록을 못 본다 | ✓ |
| 16 | 로그인 안 한 사람이 포지션을 못 본다 | ✓ |
| 17 | 로그인 안 한 사람이 추가할 수 없다 | ✓ |
| 18 | A 가 자기 기록을 삭제한다 | ✓ |
| 19 | 기록을 지우면 기술 연결이 같이 지워진다(cascade) | ✓ |
| — | 사진 · 파일 저장소 | 해당 없음(M1 에 저장소 없음) |
| — | 서버 기능(Route Handler) | **미확인** — 5단계에서 코드가 생긴 뒤 점검 |
- 방법: 관리자 키로 사용자 권한을 흉내 낸 게 아니라, DB 세션 안에서 `set local role authenticated/anon` + `request.jwt.claims` 로 **실제 RLS 가 적용되는 역할**로 실행했다. 점검용 사용자 2명은 트랜잭션 롤백으로 사라졌고, `auth.users` 에 남은 테스트 계정 0 확인.
