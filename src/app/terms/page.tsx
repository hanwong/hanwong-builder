import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "서비스 약관 — Re:Re:롤",
  description: "Re:Re:롤을 쓸 때의 약속.",
};

const EFFECTIVE = "2026년 10월 27일"; // 10/27: 문의 연락처 추가(T-30)

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. 이 서비스는",
    body: (
      <p>
        Re:Re:롤(리리롤)은 주짓수 수업에서 배운 기술을 고르면 이름 · 세팅 과정과 함께 내 기술 목록에
        쌓아 주는 개인 수련 기록 서비스예요. 김한웅이 개인으로 운영하고, 지금은 검증 중인 단계예요.
      </p>
    ),
  },
  {
    title: "2. 계정",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>카카오 · 네이버 · Google 계정으로 로그인해요. 계정은 본인만 쓰고, 다른 사람에게 빌려주지 않아요.</li>
        <li>만 14세 미만은 보호자 동의 없이 쓸 수 없어요.</li>
        <li>탈퇴는 <a href="mailto:rereroll.xyz@gmail.com" className="font-medium underline underline-offset-4">rereroll.xyz@gmail.com</a> 로 요청하면 7일 안에 처리해요(앱 안 탈퇴 버튼은 준비 중).</li>
      </ul>
    ),
  },
  {
    title: "3. 요금",
    body: (
      <p>
        기록은 <strong>무제한 무료</strong>예요. 나중에 기록이 쌓인 뒤의 정리 · 리포트
        같은 유료 기능을 열 수 있는데, 그때는 가격과 내용을 미리 알리고 동의한 사람에게만 받아요. 이미
        적은 기록이 유료로 바뀌는 일은 없어요.
      </p>
    ),
  },
  {
    title: "4. 내 기록과 기술 설명",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>본인이 적은 기록은 본인 것이에요. 서비스는 그 기록을 본인에게 보여 주는 데만 써요.</li>
        <li>
          기술 이름 · 세팅 과정 같은 설명 콘텐츠는 운영자가 만든 것이에요. 개인 수련 목적으로 자유롭게
          보되, 통째로 복사해 다른 곳에 올리지는 말아 주세요.
        </li>
        <li>‘내용 생성’으로 AI 가 만든 기술 카드는 틀릴 수 있어요. 운영자 승인 전까지는 본인만 보고, 최종 확인은 본인이 해요.</li>
      </ul>
    ),
  },
  {
    title: "5. 꼭 읽어 주세요 — 부상에 대해",
    body: (
      <p>
        여기 적힌 세팅 과정은 <strong>기억을 돕는 메모</strong>이지 지도자의 가르침을 대신하지 않아요.
        기술은 반드시 지도자의 지도 아래 연습하고, 상대와 안전하게 하세요. 이 설명을 따라 하다 생긴
        부상에 대해 서비스는 책임지지 않아요.
      </p>
    ),
  },
  {
    title: "6. 하지 말아 주세요",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>다른 사람 계정으로 들어가거나 남의 기록을 보려는 시도</li>
        <li>서비스를 멈추게 하거나 과도하게 자동 요청을 보내는 행위</li>
        <li>법에 어긋나거나 다른 사람을 해치는 내용을 기록으로 남기는 행위</li>
      </ul>
    ),
  },
  {
    title: "7. 서비스 변경 · 종료",
    body: (
      <p>
        검증 단계라 기능이 바뀌거나 일시적으로 멈출 수 있어요. 서비스를 접게 되면 최소 30일 전에 알리고,
        원하면 본인 기록을 내려받을 수 있게 할게요. 무료 서비스의 중단으로 생긴 손해는 책임지지 않아요.
      </p>
    ),
  },
  {
    title: "8. 약관 변경 · 적용 법",
    body: (
      <p>
        약관이 바뀌면 시행일을 고치고 로그인 화면에서 알려요. 이 약관은 대한민국 법을 따라요. 문의
        문의는 <a href="mailto:rereroll.xyz@gmail.com" className="font-medium underline underline-offset-4">rereroll.xyz@gmail.com</a> 로 보내 주세요.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:py-24">
      <div className="space-y-3">
        <Link href="/" className="text-[13px] font-medium text-muted-foreground underline-offset-4 hover:underline">
          ← Re:Re:롤
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">서비스 약관</h1>
        <p className="text-[13px] font-medium text-muted-foreground">시행일 {EFFECTIVE}</p>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          쉽게 쓴 버전이에요. 핵심은 세 가지: 기록은 무료, 기록은 본인 것, 기술은 지도자와 안전하게.
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
        <Link href="/privacy" className="underline underline-offset-4">
          개인정보처리방침
        </Link>
        도 함께 읽어 주세요.
      </p>
    </main>
  );
}
