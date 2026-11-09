// 관장님 버전(D-127) — 서버 · 클라이언트가 함께 쓰는 작은 값들(데이터 모듈 gym-data 는 서버 전용)
export const GYM_COOKIE = "rr_gym"; // 지금 보는 체육관(여러 개일 때) — 관장 화면에서만 쓴다
export const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
export const hhmm = (t: string) => t.slice(0, 5);

// 국내 주짓수 네트워크(소속 팀) 목록 (D-128) — 가나다순. 2026-11-09 웹 조사(나무위키 · 얼라이언스 코리아 등) + 운영자 지식으로 만든 목록이라
// 사람이 검증하지 않았고, 없는 네트워크는 관리자(rereroll.xyz@gmail.com)에게 알려 주면 더한다. 값은 이름 그대로 gyms.network 에 저장.
export const GYM_NETWORKS = [
  "골든라이온",
  "그레이시 바하",
  "그레이시 움아이타",
  "노바 우니앙",
  "데라히바",
  "동천백산",
  "또지코리아",
  "마차도",
  "본주짓수",
  "쎈짐",
  "아토스",
  "어반",
  "얼라이언스",
  "에볼루션",
  "와이어",
  "존프랭클",
  "주짓수랩",
  "체크매트",
  "칼슨 그레이시",
  "코리안탑팀",
  "킹덤",
  "트라이포스",
  "팀루츠",
  "팀매드",
  "파라에스트라",
  "퍼스트짐",
  "히베이로",
  "MARC",
] as const;
export const GYM_NETWORK_CONTACT = "rereroll.xyz@gmail.com";
// 네트워크 로고 파일(public/networks/). 출처는 public/networks/SOURCES.md — 팀 상표라 빼 달라는 요청이 오면 여기서 지운다.
export const GYM_NETWORK_ICONS: Partial<Record<(typeof GYM_NETWORKS)[number], string>> = {
  "골든라이온": "golden-lion.png",
  "그레이시 바하": "gracie-barra.png",
  "그레이시 움아이타": "gracie-humaita.png",
  "노바 우니앙": "nova-uniao.png",
  "데라히바": "de-la-riva.png",
  "마차도": "machado.png",
  "본주짓수": "bon.png",
  "어반": "urban.png",
  "얼라이언스": "alliance.png",
  "존프랭클": "john-frankl.png",
  "체크매트": "checkmat.png",
  "칼슨 그레이시": "carlson-gracie.png",
  "트라이포스": "tri-force.png",
  "팀매드": "team-mad.png",
  "파라에스트라": "paraestra.png",
  // D-146 — 2026-11-10 추가
  "동천백산": "dongcheon-baeksan.png",
  "또지코리아": "tozi-korea.png",
  "쎈짐": "ssen-gym.png",
  "아토스": "atos.png",
  "와이어": "wire.png",
  "주짓수랩": "jiujitsu-lab.png",
  "코리안탑팀": "korean-top-team.png",
  "킹덤": "kingdom.png",
  "팀루츠": "team-roots.png",
  "퍼스트짐": "first-gym.png",
  "히베이로": "ribeiro.png",
  "MARC": "marc.png",
};
export const isGymNetwork = (v: unknown): v is (typeof GYM_NETWORKS)[number] => typeof v === "string" && (GYM_NETWORKS as readonly string[]).includes(v);

// 체육관 홈 주 넘기기(D-134) — 앞뒤로 볼 수 있는 주 수(약 1년)
export const WEEK_RANGE = 52;

// 수업 이름별 색(D-137) — 시간표 칸 색. 값은 이름(DB 에 이 글자 그대로), 화면 색은 globals.css 의 --class-<값>
export const CLASS_COLORS = [
  { value: "white", label: "흰색" },
  { value: "yellow", label: "노랑" },
  { value: "mint", label: "연두" },
  { value: "sky", label: "하늘" },
  { value: "pink", label: "분홍" },
  { value: "lavender", label: "보라" },
  { value: "peach", label: "주황" },
  { value: "gray", label: "회색" },
] as const;
export type ClassColor = (typeof CLASS_COLORS)[number]["value"];
export const isClassColor = (v: unknown): v is ClassColor => CLASS_COLORS.some((c) => c.value === v);
// 색을 고른 적 없는 이름의 기본 색 — 어린이 · 유소년 = 노랑, 초보 · 기본반 = 연두(D-135)
export function defaultClassColor(name: string): ClassColor {
  if (/어린이|유소년|키즈|유아|kids/i.test(name)) return "yellow";
  if (/초보|기본|basic|입문/i.test(name)) return "mint";
  return "white";
}
