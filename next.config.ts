import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // 로그인한 사람 화면(/app)은 브라우저가 저장하지 않게 — 로그아웃 뒤 '뒤로 가기'로 이전 화면이 보이지 않도록(T-34)
  async headers() {
    return [
      {
        source: "/app/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/app",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
  partialPrefetching: true,
  // 기록 공유 이미지(D-51) — 서버에서 읽는 글꼴 · 포지션 그림을 배포 묶음에 넣는다
  outputFileTracingIncludes: {
    "/app/log/*/card": [
      "./node_modules/pretendard/dist/public/static/Pretendard-{Bold,Medium}.otf",
      "./src/assets/positions/**/*",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
