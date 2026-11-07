// 닉네임 (D-122) — 로그인 계정 정보 user_metadata.nick 에 둔다.
// nickname · name 칸은 쓰지 않는다: 카카오 · Google 로그인 때마다 그 회사 값으로 덮일 수 있다.
export const NICK_MAX = 20;

// 앞뒤 빈칸 · 줄바꿈 같은 제어 문자를 빼고, 길면 null(저장 거부). 빈 글자는 "닉네임 지우기".
export function cleanNick(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const nick = raw.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return [...nick].length <= NICK_MAX ? nick : null;
}

// 닉네임을 안 적었을 때의 기본값 — 이메일 @ 앞부분(저장하지 않고 그때그때 계산).
export function emailId(email: string | null | undefined): string {
  return email?.split("@")[0] ?? "";
}
