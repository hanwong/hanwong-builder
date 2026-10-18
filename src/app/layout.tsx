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
  title: "내일런복 — 내 옷장에서, 내일 입고 뛸 옷을 골라 드려요",
  description:
    "러닝복은 많은데 매번 뭘 입을지 고민되는 러너를 위해. 등록해 둔 내 러닝복 중에서 날씨 · 거리 · 시간대에 맞는 조합을 전날 밤 챙겨 드려요.",
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
