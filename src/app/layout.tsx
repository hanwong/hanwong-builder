import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
  display: "swap",
});

const title = "Re:Re:롤 — 오늘 배운 주짓수, 잊지 않게 해줄게요";
const description =
  "기술 이름을 몰라도 돼요. 수업에서 배운 걸 말하면 리리롤이 이름과 세팅 과정을 찾아 주고, 잊을 때쯤 복습 카드로 다시 물어봐요. 기록은 무제한 무료.";

// 카톡 · 인스타 미리보기(T-11): 제목 · 설명 · 주소 + 이미지(src/app/opengraph-image.png, 로고 카드). 아이콘은 src/app/icon.png
export const metadata: Metadata = {
  metadataBase: new URL("https://rereroll.xyz"),
  title,
  description,
  openGraph: { title, description, siteName: "Re:Re:롤", locale: "ko_KR", type: "website", url: "/" },
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
