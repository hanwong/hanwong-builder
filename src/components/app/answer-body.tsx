import { Fragment, type ReactNode } from "react";

// 질문하기 답 (D-113) — 답 형식(첫 문단 → "## 핵심" → "## 순서" 번호 단계 → "## 흔한 실수" → "## 막히면" → "> " 한 줄)만 그리는 작은 그리기.
// 마크다운 전부가 아니라 이 형식만 안다. 형식이 없는 예전 답은 문단 그대로 보인다.
type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "ol"; items: { title: string; body: string[]; subs: string[] }[] }
  | { kind: "ul"; items: string[] }
  | { kind: "note"; text: string };

function parse(answer: string): Block[] {
  const blocks: Block[] = [];
  const last = () => blocks[blocks.length - 1];
  for (const raw of answer.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const indented = /^\s{2,}/.test(line);
    const t = line.trim();
    const prev = last();
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^#{1,6}\s+(.*)$/))) blocks.push({ kind: "h", text: m[1] });
    else if ((m = t.match(/^\d+[.)]\s+(.*)$/)) && !indented) {
      const item = { title: m[1], body: [], subs: [] };
      if (prev?.kind === "ol") prev.items.push(item);
      else blocks.push({ kind: "ol", items: [item] });
    } else if (prev?.kind === "ol" && (indented || !/^[-•>]/.test(t))) {
      // 번호 다음 줄 설명 — 들여쓰기를 빼먹어도 그 단계에 붙인다
      const item = prev.items[prev.items.length - 1];
      if ((m = t.match(/^[-•]\s+(.*)$/))) item.subs.push(m[1]);
      else item.body.push(t);
    } else if ((m = t.match(/^[-•]\s+(.*)$/))) {
      if (prev?.kind === "ul") prev.items.push(m[1]);
      else blocks.push({ kind: "ul", items: [m[1]] });
    } else if ((m = t.match(/^>\s?(.*)$/))) blocks.push({ kind: "note", text: m[1] });
    else if (prev?.kind === "p") prev.text += `\n${t}`;
    else blocks.push({ kind: "p", text: t });
  }
  return blocks;
}

// **굵게** 만
function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function AnswerBody({ answer }: { answer: string }) {
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-[1.75]">
      {parse(answer).map((b, i) => {
        switch (b.kind) {
          case "h":
            return (
              <h2 key={i} className="mt-2 text-[17px] font-semibold">
                {inline(b.text)}
              </h2>
            );
          case "ol":
            return (
              <ol key={i} className="flex list-decimal flex-col gap-3 pl-5">
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1">
                    <span>{/\*\*/.test(it.title) ? inline(it.title) : <span className="font-semibold">{it.title}</span>}</span>
                    {it.body.length > 0 && <p className="whitespace-pre-line">{inline(it.body.join("\n"))}</p>}
                    {it.subs.length > 0 && (
                      <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
                        {it.subs.map((s, k) => (
                          <li key={k}>{inline(s)}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5">
                {b.items.map((s, j) => (
                  <li key={j}>{inline(s)}</li>
                ))}
              </ul>
            );
          case "note":
            return (
              <p key={i} className="border-l-2 border-border pl-3 text-[13px] leading-relaxed text-muted-foreground">
                {inline(b.text)}
              </p>
            );
          default:
            return (
              <p key={i} className="whitespace-pre-line">
                {inline(b.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
