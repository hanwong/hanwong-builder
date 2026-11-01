import type { MetadataRoute } from "next";
import { wikiParams } from "@/lib/wiki/data";
import { SITE } from "@/lib/wiki/model";

// 검색 엔진용 주소 목록 — 랜딩 · 웹 위키(D-114). 로그인 화면(/app)은 넣지 않는다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await wikiParams();
  return [
    { url: SITE },
    { url: `${SITE}/wiki` },
    ...items.map((i) => ({ url: `${SITE}/wiki/${i.kind}/${i.slug}` })),
  ];
}
