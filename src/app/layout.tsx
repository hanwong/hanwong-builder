import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
  display: "swap",
});

const title = "Re:Re:Roll — 오늘 배운 주짓수, 잊지 않게 해줄게요";
const description =
  "기술 이름을 몰라도 돼요. 포지션 그림을 눌러 오늘 배운 기술을 고르면 리리롤이 이름과 세팅 과정을 붙여 주고, 내 기술 목록에 숙련도와 함께 쌓아 둬요. 기록은 무제한 무료.";

// 카톡 · 인스타 미리보기(T-11): 제목 · 설명 · 주소 + 이미지(src/app/opengraph-image.png, 로고 카드). 아이콘은 src/app/icon.png
// 화면 확대 · 축소 막기 (D-147) — 앱처럼 고정. 아이폰 사파리는 이 값만으로는 핀치를 못 막아서 globals.css 의 touch-action 도 같이 둔다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://rereroll.xyz"),
  title,
  description,
  openGraph: { title, description, siteName: "Re:Re:Roll", locale: "ko_KR", type: "website", url: "/" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster theme="light" />
      </body>
    </html>
  );
}
