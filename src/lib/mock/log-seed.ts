// 4단계 대표 화면용 가짜 데이터. 5단계(T-06/T-07)에서 서버 매칭 결과로 교체한다.
// 기술 이름 · 세팅 과정은 supabase/migrations 의 시드(techniques)와 같은 내용을 복사했다.

export type Level = "beginner" | "novice" | "intermediate" | "advanced" | "pro";

export const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "비기너" },
  { value: "novice", label: "초보" },
  { value: "intermediate", label: "중급" },
  { value: "advanced", label: "고급" },
  { value: "pro", label: "프로" },
];

export type MatchedTechnique = {
  id: string;
  nameKo: string;
  nameEn: string;
  position: string;
  steps: string[];
  level: Level;
};

export type Term = { term: string; meaning: string };

export const seedLog = {
  loggedOn: "10월 25일 (토)",
  body:
    "상대 다리에 내 다리 감고 발목 잡는 가드 배웠고, 반대 발은 허벅지에 두라고 하셨다. 스파링에서는 니슬라이스에 계속 패스 당함. 언더훅 잡으라고 하셨는데 자꾸 놓침.",
  isMock: true,
  techniques: [
    {
      id: "de-la-riva-guard",
      nameKo: "데라히바 가드",
      nameEn: "De La Riva Guard",
      position: "오픈 가드",
      steps: [
        "상대 다리 바깥으로 내 다리를 감는다",
        "같은 쪽 발목을 손으로 잡는다",
        "반대 발은 상대 허벅지나 엉덩이에 댄다",
        "반대 손으로 소매(또는 칼라)를 잡아 균형을 깬다",
      ],
      level: "beginner",
    },
    {
      id: "knee-slice-pass",
      nameKo: "니슬라이스 패스",
      nameEn: "Knee Slice Pass",
      position: "패스",
      steps: [
        "상대 한쪽 다리 안쪽으로 무릎을 세운다",
        "같은 쪽 팔로 언더훅, 반대 손은 상대 칼라나 바지",
        "무릎을 상대 허벅지 위로 미끄러뜨리며 가슴을 누른다",
        "다리를 빼내 사이드 컨트롤로 자리 잡는다",
      ],
      level: "novice",
    },
  ] as MatchedTechnique[],
  terms: [
    { term: "언더훅", meaning: "상대 겨드랑이 밑으로 팔을 넣어 감는 것" },
    { term: "패스", meaning: "상대 가드(다리)를 넘어 사이드나 마운트로 가는 것" },
  ] as Term[],
};
