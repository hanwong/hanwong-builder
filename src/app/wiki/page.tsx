import type { Metadata } from "next";
import { getWiki } from "@/lib/wiki/data";
import { Rows, WikiNotice, wikiHref } from "@/components/wiki/wiki-parts";
import { WIKI_REPO } from "@/lib/wiki/model";

export const metadata: Metadata = {
  title: "기술 위키 — Re:Re:Roll",
  description: "주짓수 포지션 · 기술 · 원리 · 기본 드릴을 서로 이어 둔 한국어 위키. 세팅 과정 · 흔한 실수 · 막히면 다음 수까지.",
};

// 위키 목차(D-114) — 포지션 → 개념(원리 · 공부법) → 기본 드릴. 기술은 포지션 안에서.
export default async function WikiIndex() {
  const lib = await getWiki();
  const count = (slug: string) => lib.techniques.filter((t) => t.position === slug).length;
  const concept = (kind: "principle" | "learning") =>
    lib.concepts
      .filter((c) => (kind === "principle") === (c.kind === "principle"))
      .map((c) => ({ href: wikiHref("concepts", c.slug), title: c.nameKo, sub: c.summary }));
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-[24px] font-bold tracking-tight">
          <span className="mark-lime">주짓수 기술 위키</span>
        </h1>
        <p className="text-[15px] leading-relaxed">
          포지션 {lib.positions.length} · 기술 {lib.techniques.length} · 개념 {lib.concepts.length} · 기본 드릴{" "}
          {lib.drills.length}개를 서로 이어 두었어요. 포지션을 고르면 위 · 아래에서 할 일과 기술이, 기술을 고르면 세팅
          과정 · 흔한 실수 · 막히면 다음 수가 나와요.
        </p>
        <p className="text-[13px] text-muted-foreground">
          AI 에 넣어 쓰는 마크다운 묶음(LLM 위키)은{" "}
          <a href={WIKI_REPO} className="underline underline-offset-4" target="_blank" rel="noreferrer">
            GitHub
          </a>
          에서 받을 수 있어요.
        </p>
      </header>
      <Rows
        title="포지션"
        rows={lib.positions.map((p) => ({
          href: wikiHref("positions", p.slug),
          title: p.nameKo,
          sub: `기술 ${count(p.slug)}개 · ${p.summary}`,
        }))}
      />
      <Rows title="원리" rows={concept("principle")} />
      <Rows title="공부법" rows={concept("learning")} />
      <Rows
        title="기본 드릴"
        rows={lib.drills.map((d) => ({ href: wikiHref("drills", d.slug), title: d.nameKo, sub: d.summary }))}
      />
      <WikiNotice />
    </>
  );
}
