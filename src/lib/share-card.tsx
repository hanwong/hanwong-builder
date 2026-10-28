import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { formatKoreanDate } from "@/lib/seoul-date";

// 기록 공유 이미지 카드 (D-51) — 폭 1080, 높이는 내용에 맞춘 PNG. 저장하지 않고 그때그때 만든다.
// 포지션 그림(D-52)은 src/assets/positions/{slug}.png, 없으면 이름만.
const W = 1080;
const PAD_X = 80;
const MAX_TECHNIQUES = 4;
const MAX_BODY_LINES = 14;
const C = { bg: "#FAF9F4", ink: "#16160F", muted: "#6B6A5E", lime: "#DDF542", line: "#E4E2D6", card: "#FFFFFF" };

const fontDir = join(process.cwd(), "node_modules/pretendard/dist/public/static");
const fonts = Promise.all([
  readFile(join(fontDir, "Pretendard-Bold.otf")),
  readFile(join(fontDir, "Pretendard-Medium.otf")),
]);

// 글이 차지할 폭을 대략 잰다(한글 ≈ 0.95em, 영문 · 숫자 ≈ 0.55em, 띄어쓰기 ≈ 0.3em) — 높이를 내용에 맞추려고
function textWidth(s: string, size: number) {
  let w = 0;
  for (const ch of s) w += ch === " " ? 0.3 : ch.charCodeAt(0) < 128 ? 0.55 : 0.95;
  return w * size;
}
const linesOf = (s: string, size: number, width: number) => Math.max(1, Math.ceil((textWidth(s, size) * 1.06) / width));

// 포지션 그림 — 한 번 읽으면 기억(없으면 null)
const pictures = new Map<string, Promise<string | null>>();
function picture(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) return Promise.resolve(null);
  let p = pictures.get(slug);
  if (!p) {
    p = readFile(join(process.cwd(), "src/assets/positions", `${slug}.png`))
      .then((b) => `data:image/png;base64,${b.toString("base64")}`)
      .catch(() => null);
    pictures.set(slug, p);
  }
  return p;
}

export type ShareItem = { name: string; position: string; positionSlug: string | null };

export async function shareCardImage(
  { loggedOn, body, items }: { loggedOn: string; body: string; items: ShareItem[] },
  headers: Record<string, string>,
) {
  const text = body.replace(/\s*\n\s*/g, " "); // 줄바꿈은 띄어쓰기로 — 잘릴 때 앞뒤 글자가 붙지 않게
  const all = await Promise.all(
    items.map(async (t) => ({ ...t, picture: t.positionSlug ? await picture(t.positionSlug) : null })),
  );
  const shown = all.slice(0, MAX_TECHNIQUES);
  const more = all.length - shown.length;
  // 높이 = 위 여백 + 기술 카드들 + 글 + 주소 · 날짜 + 아래 여백 (각 칸 높이는 아래 스타일과 맞춘다)
  const inner = W - PAD_X * 2;
  const cardHeight = (t: (typeof shown)[number]) => {
    const nameWidth = inner - 4 - (t.picture ? 20 + 40 + 184 + 36 : 88);
    const textH = linesOf(t.name, 52, nameWidth) * 62 + 10 + 36;
    return 4 + Math.max(t.picture ? 184 + 40 : 0, textH + (t.picture ? 40 : 80));
  };
  const bodyLines = text ? Math.min(MAX_BODY_LINES, linesOf(text, 38, inner - 8 - 32)) : 0;
  const height =
    96 +
    shown.reduce((h, t) => h + cardHeight(t), 0) + Math.max(0, shown.length - 1) * 24 +
    (more > 0 ? 24 + 41 : 0) + (all.length === 0 ? 48 : 0) +
    (text ? 48 + bodyLines * 57 : 0) +
    56 + 36 + 80;

  const [bold, medium] = await fonts;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "rgba(250, 249, 244, 0.3)", // 반투명 — 사진 위에 붙이면 비친다(본인 요청)
          color: C.ink,
          padding: `96px ${PAD_X}px 80px`,
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {shown.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 36,
                background: C.card,
                border: `2px solid ${C.line}`,
                borderRadius: 44,
                padding: t.picture ? "20px 40px 20px 20px" : "40px 44px",
              }}
            >
              {t.picture && (
                // eslint-disable-next-line @next/next/no-img-element -- ImageResponse 안의 그림
                <img src={t.picture} width={184} height={184} style={{ borderRadius: 32, background: C.bg }} alt="" />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.2, wordBreak: "keep-all" }}>{t.name}</div>
                <div style={{ fontSize: 30, fontWeight: 500, color: C.muted }}>{t.position}</div>
              </div>
            </div>
          ))}
          {more > 0 && <div style={{ display: "flex", height: 41, fontSize: 34, fontWeight: 500, color: C.muted, paddingLeft: 12 }}>{`외 ${more}개`}</div>}
          {all.length === 0 && (
            <div style={{ display: "flex", height: 48, fontSize: 40, fontWeight: 500, color: C.muted }}>기술 이름 없이 기록했어요</div>
          )}
        </div>

        {text && (
          <div
            style={{
              display: "flex",
              marginTop: 48,
              paddingLeft: 32,
              borderLeft: `8px solid ${C.lime}`,
            }}
          >
            <div
              style={{
                display: "block",
                fontSize: 38,
                fontWeight: 500,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                lineClamp: bodyLines,
              }}
            >
              {text}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "auto",
            height: 36,
            fontSize: 30,
            fontWeight: 500,
            color: C.muted,
          }}
        >
          <span>rereroll.xyz</span>
          <span>{formatKoreanDate(loggedOn)}</span>
        </div>
      </div>
    ),
    {
      width: W,
      height,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: medium, weight: 500, style: "normal" },
      ],
      headers,
    },
  );
}
