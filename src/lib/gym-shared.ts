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
  "마차도",
  "브라사",
  "소울 파이터스",
  "아토스",
  "얼라이언스",
  "에볼브",
  "존프랭클",
  "체크매트",
  "칼슨 그레이시",
  "코리안탑팀",
  "파라에스트라",
  "히베이로",
] as const;
export const GYM_NETWORK_CONTACT = "rereroll.xyz@gmail.com";
export const isGymNetwork = (v: unknown): v is (typeof GYM_NETWORKS)[number] => typeof v === "string" && (GYM_NETWORKS as readonly string[]).includes(v);
