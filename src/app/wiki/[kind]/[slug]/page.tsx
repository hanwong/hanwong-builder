import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Block, LineBlock, Lines, PageHead, Rows, techRow, WikiNotice, wikiHref } from "@/components/wiki/wiki-parts";
import { ROLE_NOTE } from "@/lib/mcp/labels";
import type { Concept, Drill, Library, Position, Technique } from "@/lib/mcp/library-data";
import { getWiki, KINDS, wikiParams } from "@/lib/wiki/data";
import {
  arrivingAt,
  conceptsForPosition,
  conceptsForTechnique,
  drillsForTechnique,
  notesFor,
  techMeta,
  techniquesByRole,
  type Kind,
} from "@/lib/wiki/model";

// 위키 항목(D-114, FLOW `/wiki/[kind]/[slug]`) — 포지션 · 기술 · 개념 · 드릴. 모두 빌드 때 미리 만들고, 새 항목은 첫 방문 때 만든다.
export const generateStaticParams = wikiParams;

type Params = { params: Promise<{ kind: string; slug: string }> };

async function find(params: Params["params"]) {
  const { kind, slug } = await params;
  if (!KINDS.includes(kind as Kind)) return null;
  const lib = await getWiki();
  const item =
    kind === "positions"
      ? lib.posBySlug.get(slug)
      : kind === "techniques"
        ? lib.bySlug.get(slug)
        : kind === "concepts"
          ? lib.conceptBySlug.get(slug)
          : lib.drills.find((d) => d.slug === slug);
  return item ? { lib, kind: kind as Kind, item } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const hit = await find(params);
  if (!hit) return { title: "기술 위키 — Re:Re:Roll" };
  const { item } = hit;
  const summary = "summary" in item && item.summary ? item.summary : "keyPoints" in item ? item.keyPoints[0] : "";
  return { title: `${item.nameKo} (${item.nameEn}) — 리리롤 기술 위키`, description: summary };
}

export default function WikiItemPage({ params }: Params) {
  return (
    <Suspense fallback={<ItemSkeleton />}>
      <Item params={params} />
    </Suspense>
  );
}

async function Item({ params }: Params) {
  const hit = await find(params);
  if (!hit) notFound();
  const { lib, kind, item } = hit;
  return (
    <>
      {kind === "positions" && <PositionView lib={lib} p={item as Position} />}
      {kind === "techniques" && <TechniqueView lib={lib} t={item as Technique} />}
      {kind === "concepts" && <ConceptView lib={lib} c={item as Concept} />}
      {kind === "drills" && <DrillView lib={lib} d={item as Drill} />}
      <WikiNotice />
    </>
  );
}

function PositionView({ lib, p }: { lib: Library; p: Position }) {
  return (
    <>
      <PageHead badge="포지션" title={p.nameKo} sub={p.nameEn}>
        <p className="text-[15px] leading-relaxed">{p.summary}</p>
      </PageHead>
      <LineBlock title="이런 모양도 이 포지션이에요" lines={p.variants} />
      {notesFor(lib, p.slug).map((n) => (
        <Block key={n.role} title={`${ROLE_NOTE[n.role]}${n.role === "standing" ? "" : "에서"}`}>
          <Sub title="목표 (순서대로)" lines={n.goals} numbered />
          <Sub title="핵심" lines={n.keys} />
          <Sub title="상대가 ~하면" lines={n.decisions} lib={lib} />
          <Sub title="흔한 실수" lines={n.mistakes} />
          <Sub title="드릴" lines={n.drills} />
        </Block>
      ))}
      {techniquesByRole(lib, p.slug).map((g) => (
        <Rows key={g.role} title={`기술 — ${g.label} (${g.items.length})`} rows={g.items.map((t) => techRow(lib, t))} />
      ))}
      <Rows title="이 포지션으로 오는 기술" rows={arrivingAt(lib, p.slug).map((t) => techRow(lib, t, true))} />
      <Rows
        title="관련 개념"
        rows={conceptsForPosition(lib, p.slug).map((c) => ({ href: wikiHref("concepts", c.slug), title: c.nameKo, sub: c.summary }))}
      />
    </>
  );
}

function Sub({ title, lines, lib, numbered }: { title: string; lines: string[]; lib?: Library; numbered?: boolean }) {
  if (!lines.length) return null;
  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <h3 className="text-[13px] font-semibold text-muted-foreground">{title}</h3>
      <Lines lines={lines} lib={lib} numbered={numbered} />
    </div>
  );
}

function TechniqueView({ lib, t }: { lib: Library; t: Technique }) {
  const pos = lib.posBySlug.get(t.position);
  const ends = t.endsAt.map((s) => lib.posBySlug.get(s)).filter(Boolean) as Position[];
  return (
    <>
      <PageHead
        badge={techMeta(lib, t).split(" → ")[0] || "기술"}
        title={t.nameKo}
        sub={`${t.nameEn}${t.aliases.length ? ` · 다른 이름: ${t.aliases.join(", ")}` : ""}`}
      >
        <p className="text-[15px] leading-relaxed">
          {pos && <PosLink p={pos} />}
          {ends.length > 0 && (
            <>
              {" → "}
              {ends.map((e, i) => (
                <span key={e.slug}>
                  {i > 0 && " / "}
                  <PosLink p={e} />
                </span>
              ))}
            </>
          )}
        </p>
      </PageHead>
      <LineBlock title="규정 · 안전" lines={t.rules} />
      <LineBlock title="세팅 과정" aside="오른손잡이 기준" lines={t.steps} numbered />
      <LineBlock title="핵심 디테일" lines={t.keyPoints} />
      <LineBlock title="흔한 실수" lines={t.mistakes} />
      <LineBlock title="막히면" lines={t.ifBlocked} lib={lib} />
      <LineBlock title="방어하는 쪽 (상대 입장)" lines={t.defense} />
      <Rows
        title="함께 보기"
        rows={[
          ...conceptsForTechnique(lib, t.slug).map((c) => ({ href: wikiHref("concepts", c.slug), title: c.nameKo, sub: `개념 · ${c.summary}` })),
          ...drillsForTechnique(lib, t.slug).map((d) => ({ href: wikiHref("drills", d.slug), title: d.nameKo, sub: `기본 드릴 · ${d.summary}` })),
        ]}
      />
    </>
  );
}

function PosLink({ p }: { p: Position }) {
  return (
    <Link href={wikiHref("positions", p.slug)} className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
      {p.nameKo}
    </Link>
  );
}

function ConceptView({ lib, c }: { lib: Library; c: Concept }) {
  return (
    <>
      <PageHead badge={c.kind === "principle" ? "원리" : "공부법"} title={c.nameKo} sub={c.nameEn}>
        <p className="text-[15px] leading-relaxed">{c.summary}</p>
      </PageHead>
      <LineBlock title="설명" lines={c.body} />
      <LineBlock title="어디서 쓰나" lines={c.examples} />
      <Rows
        title="관련 포지션"
        rows={c.relatedPositions.flatMap((s) => {
          const p = lib.posBySlug.get(s);
          return p ? [{ href: wikiHref("positions", p.slug), title: p.nameKo, sub: p.summary }] : [];
        })}
      />
      <Rows
        title="관련 기술"
        rows={c.relatedTechniques.flatMap((s) => {
          const t = lib.bySlug.get(s);
          return t ? [techRow(lib, t, true)] : [];
        })}
      />
      <Rows
        title="함께 보기"
        rows={c.seeAlso.flatMap((s) => {
          const x = lib.conceptBySlug.get(s);
          return x ? [{ href: wikiHref("concepts", x.slug), title: x.nameKo, sub: x.summary }] : [];
        })}
      />
    </>
  );
}

function DrillView({ lib, d }: { lib: Library; d: Drill }) {
  return (
    <>
      <PageHead badge="기본 드릴" title={d.nameKo} sub={`${d.nameEn}${d.aliases.length ? ` · 다른 이름: ${d.aliases.join(", ")}` : ""}`}>
        <p className="text-[15px] leading-relaxed">{d.summary}</p>
      </PageHead>
      <LineBlock title="하는 법" aside="오른손잡이 기준 · 양쪽 번갈아" lines={d.steps} numbered />
      <LineBlock title="노하우" lines={d.tips} />
      <LineBlock title="이 드릴이 필요한 이유" lines={d.why} />
      <Rows
        title="이어지는 기술"
        rows={d.related.flatMap((s) => {
          const t = lib.bySlug.get(s);
          return t ? [techRow(lib, t, true)] : [];
        })}
      />
    </>
  );
}

function ItemSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}
