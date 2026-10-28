import "server-only";

// ★ 실제 키로 바꾸는 지점은 여기 하나 ★
// ANTHROPIC_API_KEY 가 .env.local(내 컴퓨터) · Vercel 환경변수(인터넷 주소)에 있으면 Claude, 없으면 연습용 예시.
// 기록 화면의 정리하기는 D-56 으로 없앴고, 지금은 운영 화면의 목록 밖 이름 초안(D-47)만 Claude 를 쓴다.
const LIVE = Boolean(process.env.ANTHROPIC_API_KEY);
export const isLive = () => LIVE;
