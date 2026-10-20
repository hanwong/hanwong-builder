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
  title: "Windner — 10일치 러닝 복장, 미리 정해 드려요",
  description:
    "정해진 요일에 뛰는 루틴 러너를 위해. 옷 등록 없이, 시간별 날씨에 맞는 러닝 의류를 실제 제품으로 보여 드려요. 내 러닝 스케줄에 저장해 두면 전날 밤 고민이 끝나요.",
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
