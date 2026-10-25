import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 — Re:Re:롤",
  description: "Re:Re:롤이 어떤 정보를 받고, 어디에 두고, 언제 지우는지.",
};

// 시행일은 고정 글자 (cacheComponents: 렌더 중 new Date() 금지)
const EFFECTIVE = "2026년 10월 26일";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. 누가 운영하나",
    body: (
      <p>
        Re:Re:롤(리리롤)은 김한웅이 개인으로 만들고 운영하는 주짓수 수련 기록 서비스예요. 지금은
        검증 중인 단계라 가까운 수련자들과 함께 써 보고 있어요.
      </p>
    ),
  },
  {
    title: "2. 어떤 정보를 받나",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Google 로그인 정보</strong> — 이메일 주소, 이름, 프로필 사진 주소, Google 계정 ID.
          로그인과 "이 기록이 누구 것인지"를 구분하는 데만 써요. 비밀번호는 받지도 저장하지도 않아요.
        </li>
        <li>
          <strong>직접 적는 기록</strong> — 오늘 배운 것 글, 거기서 고른 기술과 숙련도, 복습 카드 결과.
          이 서비스의 기능 자체예요.
        </li>
        <li>
          <strong>자동으로 남는 것</strong> — 접속 시각 같은 서버 기록. 장애를 고칠 때만 봐요.
        </li>
      </ul>
    ),
  },
  {
    title: "3. 어디에 두나",
    body: (
      <p>
        로그인 정보와 기록은 Supabase(클라우드 데이터베이스)에 저장돼요. 서비스 화면은 Vercel 에서
        운영해요. 기록은 <strong>본인 계정으로만</strong> 읽고 쓸 수 있도록 데이터베이스 규칙(RLS)으로
        막아 두었어요. 운영자도 앱 화면에서는 남의 기록을 볼 수 없어요.
      </p>
    ),
  },
  {
    title: "4. AI 에 보내는 것",
    body: (
      <p>
        "정리하기"를 누르면 <strong>그 글 한 편만</strong> AI(Anthropic Claude)에 보내 기술 이름을
        찾아요. 이름 · 이메일 · 다른 날의 기록은 보내지 않아요. AI 연결이 아직 안 된 동안은 아무것도
        보내지 않고 화면에 "연습용 예시"라고 표시돼요.
      </p>
    ),
  },
  {
    title: "5. 언제 지우나",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>탈퇴를 요청하면 로그인 정보와 기록 전부를 7일 안에 지워요.</li>
        <li>검증 단계가 끝나고 서비스를 접게 되면, 미리 알린 뒤 모든 기록을 지워요.</li>
        <li>본인 기록은 언제든 앱에서 직접 지울 수 있게 만들 예정이에요(준비 중).</li>
      </ul>
    ),
  },
  {
    title: "6. 하지 않는 것",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>정보를 팔거나 광고에 쓰지 않아요.</li>
        <li>다른 수련자에게 내 기록을 보여 주지 않아요.</li>
        <li>로그인 외의 목적으로 Google 계정에 접근하지 않아요.</li>
      </ul>
    ),
  },
  {
    title: "7. 문의",
    body: (
      <p>
        정보 열람 · 수정 · 삭제 요청이나 궁금한 점은 운영자에게 알려 주세요. 문의 연락처는 준비 중이며,
        정해지는 대로 이 자리에 적을게요.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:py-24">
      <div className="space-y-3">
        <Link href="/" className="text-[13px] font-medium text-muted-foreground underline-offset-4 hover:underline">
          ← Re:Re:롤
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">개인정보처리방침</h1>
        <p className="text-[13px] font-medium text-muted-foreground">시행일 {EFFECTIVE}</p>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          쉽게 쓴 버전이에요. 받는 정보는 Google 로그인 정보와 본인이 적는 기록뿐이고, 본인만 볼 수
          있어요.
        </p>
      </div>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.title} className="space-y-2 text-[15px] leading-relaxed">
            <h2 className="text-[17px] font-semibold">{s.title}</h2>
            {s.body}
          </section>
        ))}
      </div>
      <p className="mt-12 text-[13px] font-medium text-muted-foreground">
        내용이 바뀌면 이 페이지의 시행일을 고치고, 큰 변화는 로그인 화면에서 알려요.
      </p>
    </main>
  );
}
