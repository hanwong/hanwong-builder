import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Library, Technique } from "@/lib/mcp/library-data";
import {
  LICENSE_NAME,
  LICENSE_URL,
  segments,
  techMeta,
  WIKI_NOTICE,
  WIKI_REPO,
  type Kind,
} from "@/lib/wiki/model";

// 웹 위키(D-114) 부품 — 기술 상세 · 드릴 화면과 같은 머리 · 카드 · 목록 줄(DESIGN 위키).

export const wikiHref = (kind: Kind, slug: string) => `/wiki/${kind}/${slug}`;

export function PageHead({ badge, title, sub, children }: { badge: string; title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <Badge variant="secondary" className="self-start">
        {badge}
      </Badge>
      <h1 className="text-[24px] font-bold tracking-tight">
        <span className="mark-lime">{title}</span>
      </h1>
      {sub && <p className="text-[13px] font-medium text-muted-foreground">{sub}</p>}
      {children}
    </header>
  );
}

export function Block({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <Card className="rounded-2xl ring-border">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          {aside && <span className="text-[12px] font-medium text-muted-foreground">{aside}</span>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/** "→ 기술" 자리를 위키 링크로 바꾼 한 줄. */
export function LinkedLine({ lib, line }: { lib: Library; line: string }) {
  return (
    <>
      {segments(lib, line).map((s, i) =>
        typeof s === "string" ? (
          s
        ) : (
          <Link
            key={i}
            href={wikiHref(s.kind === "technique" ? "techniques" : "positions", s.slug)}
            className="font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {s.name}
          </Link>
        ),
      )}
    </>
  );
}

export function Lines({ lines, lib, numbered }: { lines: string[]; lib?: Library; numbered?: boolean }) {
  const Tag = numbered ? "ol" : "ul";
  return (
    <Tag className={`flex ${numbered ? "list-decimal" : "list-disc"} flex-col gap-1.5 pl-5 text-[15px] leading-relaxed`}>
      {lines.map((l) => (
        <li key={l}>{lib ? <LinkedLine lib={lib} line={l} /> : l}</li>
      ))}
    </Tag>
  );
}

export function LineBlock({ title, aside, lines, lib, numbered }: { title: string; aside?: string; lines: string[]; lib?: Library; numbered?: boolean }) {
  if (!lines.length) return null;
  return (
    <Block title={title} aside={aside}>
      <Lines lines={lines} lib={lib} numbered={numbered} />
    </Block>
  );
}

export type Row = { href: string; title: string; sub?: string };

export function Rows({ title, rows }: { title?: string; rows: Row[] }) {
  if (!rows.length) return null;
  return (
    <section className="flex flex-col gap-2">
      {title && <h2 className="text-[17px] font-semibold">{title}</h2>}
      <ul className="flex flex-col overflow-hidden rounded-2xl bg-card py-1 ring-1 ring-border">
        {rows.map((r) => (
          <li key={r.href} className="min-w-0">
            <Link href={r.href} className="flex min-w-0 items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px]">{r.title}</span>
                {r.sub && <span className="truncate text-[12px] text-muted-foreground">{r.sub}</span>}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const techRow = (lib: Library, t: Technique, withPosition = false): Row => ({
  href: wikiHref("techniques", t.slug),
  title: t.nameKo,
  sub: [withPosition ? lib.posBySlug.get(t.position)?.nameKo : "", techMeta(lib, t)].filter(Boolean).join(" · "),
});

/** 페이지 끝 안내 — 오른손잡이 · AI 작성 · 라이선스. */
export function WikiNotice() {
  return (
    <footer className="flex flex-col gap-1 border-t pt-4 text-[12px] leading-relaxed text-muted-foreground">
      <p>{WIKI_NOTICE.join(" ")}</p>
      <p>
        리리롤 기술 지도 ·{" "}
        <a href={LICENSE_URL} className="underline underline-offset-4" target="_blank" rel="noreferrer">
          {LICENSE_NAME}
        </a>{" "}
        — 비상업 목적으로, 출처를 밝히고, 같은 조건으로만 나눌 수 있어요. AI 에 넣어 쓰는 마크다운은{" "}
        <a href={WIKI_REPO} className="underline underline-offset-4" target="_blank" rel="noreferrer">
          GitHub
        </a>
        에 있어요.
      </p>
    </footer>
  );
}
