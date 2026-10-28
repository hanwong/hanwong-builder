import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 — Re:Re:롤",
  description: "Re:Re:롤이 어떤 정보를 받고, 어디에 두고, 언제 지우는지.",
};

// 시행일은 고정 글자 (cacheComponents: 렌더 중 new Date() 금지)
const EFFECTIVE = "2026년 10월 29일"; // 10/27: 운영자 열람 · 벨트 색 추가(T-29) / 10/28: 직접 적은 기술 이름 AI 초안(D-47) · 보완 제안(D-50) / 10/29: 정리하기 없앰(D-56) · 내용 생성(D-57) · 복습 뺌(D-58) · 수련 시작 연월(D-59)

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
          <strong>로그인 정보</strong> — 카카오 · 네이버 · Google 중 고른 곳에서 받는 이메일 주소와 그 회사의 계정
          ID. Google 은 이름 · 프로필 사진 주소도 함께 오고, 카카오는 닉네임 · 프로필 사진을 ‘선택’으로 동의했을 때만
          와요(화면에는 쓰지 않아요). 로그인과 ‘이 기록이 누구 것인지’를 구분하는 데만 써요. 같은 이메일로
          로그인하면 같은 계정으로 이어져요. 비밀번호는 받지도 저장하지도 않아요.
        </li>
        <li>
          <strong>직접 적는 기록</strong> — 오늘 배운 것에서 고른 기술과 숙련도, 오늘 메모, 직접 적은 기술 이름과
          그 이름으로 만든 기술 카드. 이 서비스의 기능 자체예요. 예전에 쓰던 복습 카드 결과는 기능을 뺀 뒤에도
          지우지 않고 보관만 해요(화면에는 안 보여요).
        </li>
        <li>
          <strong>화면 설정</strong> — 홈 수련 벨트에 고른 벨트 색과 주짓수를 시작한 연 · 월(적었을 때만). 로그인 계정
          정보에 함께 저장되고, 홈에 ‘수련 N년째’로 보여 주는 데만 써요.
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
      <>
        <p>
          로그인 정보와 기록은 Supabase(클라우드 데이터베이스)에 저장돼요. 서비스 화면은 Vercel 에서
          운영해요. 기록은 <strong>본인 계정으로만</strong> 읽고 쓸 수 있도록 데이터베이스 규칙(RLS)으로
          막아 두었어요. 다른 사용자는 내 기록을 볼 수 없고, 운영자도 앱 화면에서는 볼 수 없어요.
        </p>
        <p className="mt-2">
          다만 <strong>운영자(김한웅)는 데이터베이스 관리 화면에서 기록을 볼 수 있어요.</strong> 이 권한은
          운영에 필요할 때만 써요 — 기술 목록에 없어 직접 적은 기술 이름을 목록에 추가할 때, 오류를 고칠 때,
          삭제 요청을 처리할 때. 그 밖의 목적으로 기록을 읽거나 다른 곳에 넘기지 않아요.
        </p>
        <p className="mt-2">
          기술 상세에서 보낸 <strong>내용 보완 제안</strong>(고친 세팅 과정 · 다른 이름 · 이유)은 운영자가 앱의 운영
          화면에서 읽고 반영 여부를 정해요. 운영 화면에는 누가 보냈는지 보이지 않고, 반영되면 보낸 사람에게만
          알림이 가요.
        </p>
      </>
    ),
  },
  {
    title: "4. AI 에 보내는 것",
    body: (
      <>
        <p>
          기술 목록에 없어 <strong>직접 적은 기술 이름</strong>은 두 경우에 <strong>그 이름만</strong>{" "}
          AI(Anthropic Claude)에 보내 기술 카드를 만들어요 — 내가 그 이름 옆 ‘내용 생성’을 누를 때(하루
          3번), 그리고 운영자가 목록에 넣을지 검토할 때. 누가 적었는지 · 메모 · 이메일 · 다른 기록은 보내지
          않아요. 그래서 기술 이름 칸에는 사람 이름을 적지 말아 주세요.
        </p>
        <p className="mt-2">
          ‘내용 생성’으로 만든 기술 카드는 운영자가 승인하기 전까지 나에게만 보여요. 승인되면 모든 사용자의
          기술 목록에 들어가지만, 누가 만들었는지는 보이지 않아요.
        </p>
      </>
    ),
  },
  {
    title: "5. 언제 지우나",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>탈퇴를 요청하면 로그인 정보와 기록 전부를 7일 안에 지워요.</li>
        <li>검증 단계가 끝나고 서비스를 접게 되면, 미리 알린 뒤 모든 기록을 지워요.</li>
        <li>본인 기록은 언제든 앱에서 직접 지울 수 있어요(홈 → 최근 기록 → 맨 아래 &quot;이 기록 지우기&quot;). 지우면 바로 사라지고 되돌릴 수 없어요.</li>
      </ul>
    ),
  },
  {
    title: "6. 하지 않는 것",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>정보를 팔거나 광고에 쓰지 않아요.</li>
        <li>다른 수련자에게 내 기록을 보여 주지 않아요.</li>
        <li>로그인 외의 목적으로 카카오 · 네이버 · Google 계정에 접근하지 않아요. 친구 목록 · 메시지 보내기 권한은 받지 않아요.</li>
      </ul>
    ),
  },
  {
    title: "7. 문의",
    body: (
      <p>
        정보 열람 · 수정 · 삭제 요청이나 궁금한 점은 <a href="mailto:rereroll.xyz@gmail.com" className="font-medium underline underline-offset-4">rereroll.xyz@gmail.com</a> 로 보내 주세요. 받은 날부터
        7일 안에 답하고, 삭제 요청은 그 안에 처리해요.
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
          쉽게 쓴 버전이에요. 받는 정보는 로그인한 계정의 이메일과 본인이 적는 기록뿐이에요. 앱에서는 본인만 볼
          수 있고, 운영자는 운영에 필요할 때만 데이터베이스에서 봐요(3번).
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
