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

export const metadata: Metadata = {
  title: "롤링스탯 — 오늘 배운 주짓수, 잊지 않게 해줄게요",
  description:
    "기술 이름을 몰라도 돼요. 수업에서 배운 걸 말하면 롤링스탯이 이름과 세팅 과정을 찾아 스킬트리에 꽂고, 잊을 때쯤 복습 카드로 다시 물어봐요. 스파링에서 막힌 것도 모아서, 내가 어디가 비었는지 보여 줘요.",
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
