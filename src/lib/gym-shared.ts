// 관장님 버전(D-127) — 서버 · 클라이언트가 함께 쓰는 작은 값들(데이터 모듈 gym-data 는 서버 전용)
export const GYM_COOKIE = "rr_gym"; // 지금 보는 체육관(여러 개일 때) — 관장 화면에서만 쓴다
export const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
export const hhmm = (t: string) => t.slice(0, 5);
