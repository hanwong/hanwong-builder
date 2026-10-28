import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { formatKoreanDate } from "@/lib/seoul-date";

// 기록 공유 이미지 카드 (D-51) — 인스타 스토리 크기 PNG. 저장하지 않고 그때그때 만든다.
// 포지션 그림(D-52)은 src/assets/positions/{slug}.png, 없으면 이름만.
const W = 1080;
const H = 1920;
const MAX_TECHNIQUES = 4;
const C = { bg: "#FAF9F4", ink: "#16160F", muted: "#6B6A5E", lime: "#DDF542", line: "#E4E2D6", card: "#FFFFFF" };

const fontDir = join(process.cwd(), "node_modules/pretendard/dist/public/static");
const fonts = Promise.all([
  readFile(join(fontDir, "Pretendard-Bold.otf")),
  readFile(join(fontDir, "Pretendard-Medium.otf")),
]);

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
  const all = await Promise.all(
    items.map(async (t) => ({ ...t, picture: t.positionSlug ? await picture(t.positionSlug) : null })),
  );
  const shown = all.slice(0, MAX_TECHNIQUES);
  const more = all.length - shown.length;
  // 남은 높이에 맞춰 글 줄 수를 정한다(기술 카드 하나 ≈ 250px, 글 한 줄 ≈ 58px)
  const bodyLines = Math.max(3, Math.floor((1240 - shown.length * 250 - (more > 0 ? 60 : 0)) / 58));

  const [bold, medium] = await fonts;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          color: C.ink,
          padding: "120px 80px 96px",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 34 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 700 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.lime }} />
            Re:Re:롤
          </div>
          <div style={{ color: C.muted, fontWeight: 500 }}>{formatKoreanDate(loggedOn)}</div>
        </div>

        <div style={{ display: "flex", marginTop: 64, fontSize: 92, fontWeight: 700, letterSpacing: -2 }}>
          <span
            style={{
              backgroundImage: `linear-gradient(transparent 58%, ${C.lime} 58%, ${C.lime} 92%, transparent 92%)`,
              padding: "0 8px",
            }}
          >
            오늘 배운 것
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 56 }}>
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
          {more > 0 && <div style={{ fontSize: 34, fontWeight: 500, color: C.muted, paddingLeft: 12 }}>{`외 ${more}개`}</div>}
          {all.length === 0 && (
            <div style={{ fontSize: 40, fontWeight: 500, color: C.muted }}>기술 이름 없이 기록했어요</div>
          )}
        </div>

        {body && (
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
              {body}
            </div>
          </div>
        )}

        <div style={{ display: "flex", marginTop: "auto", fontSize: 30, fontWeight: 500, color: C.muted }}>
          rereroll.xyz · 리리롤로 기록했어요
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: medium, weight: 500, style: "normal" },
      ],
      headers,
    },
  );
}
