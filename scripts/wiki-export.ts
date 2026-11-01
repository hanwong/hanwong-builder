// 기술 지도 LLM 위키 내보내기(D-114) — 공용 기술 지도를 마크다운 문서로 만들어 폴더에 쓴다.
// 쓰는 법: npm run wiki:export -- ../rereroll-wiki   (그 폴더에서 git commit · push 하면 GitHub 위키가 바뀐다)
// 로그인 없는(anon) 연결로 읽어서 사용자 기록 · 숙련도 · 내가 만든 기술은 들어가지 않는다.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

(globalThis as { WebSocket?: unknown }).WebSocket ??= class {}; // Node 20 — 실시간 기능은 안 쓴다
process.loadEnvFile(".env.local");

async function main() {
  const { fetchLibraryData, toLibrary } = await import("@/lib/mcp/library-data");
  const { wikiFiles } = await import("@/lib/wiki/markdown");
  const out = resolve(process.argv[2] ?? "../rereroll-wiki");
  const lib = toLibrary(await fetchLibraryData());
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const files = wikiFiles(lib, date);
  for (const f of files) if (!/^([a-z]+\/)?[a-zA-Z0-9-]+\.md$/.test(f.path)) throw new Error(`이상한 파일 이름: ${f.path}`);
  // 지도에서 빠진 항목의 문서가 남지 않게 항목 폴더는 비우고 다시 쓴다
  for (const dir of ["positions", "techniques", "concepts", "drills"]) rmSync(join(out, dir), { recursive: true, force: true });
  for (const f of files) {
    const path = join(out, f.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, f.content);
  }
  console.log(`위키 문서 ${files.length}개 → ${out} (${date})`);
  console.log(readdirSync(out).join(" "));
}

main().catch((e) => {
  console.error("실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
