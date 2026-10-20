// 네이버 데이터랩 검색어트렌드 API(NAVER API HUB)로 키워드 상대 검색량을 잰다.
// 사용: node scripts/naver-trend.mjs "키워드1" "키워드2" ...   (.env.local 의 NAVER_API_KEY_ID / NAVER_API_KEY 사용)
// 기준 키워드(ANCHOR)를 매 묶음에 끼워 넣어, 묶음이 달라도 값을 비교할 수 있게 ANCHOR = 50 으로 맞춘다.
// 2026-07-31 부터 신규 키는 네이버 개발자센터가 아니라 NAVER API HUB(네이버 클라우드 플랫폼)에서 받는다.
import fs from "node:fs";

const ANCHOR = process.env.ANCHOR || "마라톤 대회";
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const id = env.NAVER_API_KEY_ID || env.NAVER_CLIENT_ID, secret = env.NAVER_API_KEY || env.NAVER_CLIENT_SECRET;
if (!id || !secret) { console.error(".env.local 에 NAVER_CLIENT_ID 와 NAVER_CLIENT_SECRET 이 필요해요."); process.exit(1); }

const keywords = process.argv.slice(2).filter((k) => k !== ANCHOR);
if (!keywords.length) { console.error("키워드를 하나 이상 주세요."); process.exit(1); }

// 최근 12개월 (지난달 말까지)
const now = new Date();
const end = new Date(now.getFullYear(), now.getMonth(), 0);
const start = new Date(end.getFullYear() - 1, end.getMonth() + 1, 1);
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function query(groupKeywords) {
  const body = {
    startDate: fmt(start), endDate: fmt(end), timeUnit: "month",
    keywordGroups: groupKeywords.map((k) => ({ groupName: k, keywords: [k] })),
  };
  const r = await fetch("https://naverapihub.apigw.ntruss.com/search-trend/v1/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-NCP-APIGW-API-KEY-ID": id, "X-NCP-APIGW-API-KEY": secret },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).results;
}

const rows = [];
for (let i = 0; i < keywords.length; i += 4) {
  const batch = [ANCHOR, ...keywords.slice(i, i + 4)];
  const results = await query(batch);
  const avg = (d) => d.reduce((a, b) => a + b.ratio, 0) / Math.max(d.length, 1);
  const anchorAvg = avg(results.find((x) => x.title === ANCHOR).data) || 1;
  for (const res of results) {
    if (res.title === ANCHOR) continue;
    const a = avg(res.data);
    const peak = res.data.reduce((p, c) => (c.ratio > p.ratio ? c : p), { ratio: -1, period: "-" });
    rows.push({ keyword: res.title, index: Math.round((a / anchorAvg) * 50), peak: peak.period.slice(0, 7), raw: res.data.map((d) => Math.round(d.ratio)).join(" ") });
  }
  await new Promise((r) => setTimeout(r, 300));
}
rows.sort((a, b) => b.index - a.index);
console.log(`기간 ${fmt(start)} ~ ${fmt(end)} · 월 단위 · 기준 "${ANCHOR}" = 50\n`);
console.log("| 키워드 | 지수 | 피크 달 | 월별 (원시 비율) |\n|---|---|---|---|");
for (const r of rows) console.log(`| ${r.keyword} | ${r.index} | ${r.peak} | ${r.raw} |`);
