import { LEVELS, type Level } from "@/lib/mock/log-seed";
import type { PositionGroup } from "@/lib/skills-data";

// 내 기술 분포 레이더(D-163 · D-167) — 기술 종류 10가지를 주짓수 한 판의 흐름 6갈래로 묶은 육각형.
// 축 값 = 그 갈래에서 내가 숙련도를 매긴 기술들의 숙련도 합(비기너 1 … 프로 5).
// 가장 큰 축이 바깥 끝에 닿게 맞춘다 — "얼마나 잘하나"가 아니라 "어디에 몰려 있나"(분포)를 보여 준다.
const AXES = ["스탠딩", "가드", "패스", "포지션 · 백", "서브미션", "탈출 · 방어"] as const;

// 패스를 시도하는 자리 — 여기서 위에 있는 사람의 유지 · 연결 기술은 아직 "패스" 쪽
const PASSING_SPOTS = new Set(["passing", "half-guard", "closed-guard", "deep-half"]);

// 어느 축에 넣나(D-167). 유지(control) · 연결(transition) 기술은 누가 어디서 하느냐로 나눈다:
// 아래(가드)에서 자리를 잡고 지키는 기술 → 가드, 패스한 뒤 위에서 자리를 지키는 기술 → 포지션 · 백
function axisOf(kind: string, role: string | null | undefined, position: string): number {
  switch (kind) {
    case "takedown":
      return 0;
    case "guard_pull": // 가드를 잡는 것 자체
    case "sweep":
      return 1;
    case "pass":
      return 2;
    case "back_take":
      return 3;
    case "submission":
      return 4;
    case "escape":
    case "defense":
      return 5;
    case "control":
    case "transition":
      if (role === "standing") return 0;
      if (role === "bottom") return 1;
      return PASSING_SPOTS.has(position) ? 2 : 3;
    default:
      return -1;
  }
}
const WEIGHT = new Map<Level, number>(LEVELS.map((l, i) => [l.value, i + 1]));

const W = 320;
const H = 270;
const CX = W / 2;
const CY = H / 2 + 2;
const R = 88;
const point = (i: number, r: number) => {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};
const poly = (rs: number[]) => rs.map((r, i) => point(i, r).join(",")).join(" ");

export function SkillRadar({
  groups,
  title = "내 기술 분포",
  emptyText = "기록에서 숙련도를 매기면 어느 쪽 기술이 많은지 모양이 생겨요.",
}: {
  groups: PositionGroup[];
  title?: string;
  emptyText?: string;
}) {
  const stats = AXES.map(() => ({ count: 0, score: 0 }));
  for (const g of groups)
    for (const s of g.skills) {
      if (!s.level || !s.kind) continue;
      const i = axisOf(s.kind, s.role, g.slug);
      if (i < 0) continue;
      stats[i].count += 1;
      stats[i].score += WEIGHT.get(s.level) ?? 1;
    }
  const total = stats.reduce((n, s) => n + s.count, 0);
  const max = Math.max(1, ...stats.map((s) => s.score));
  const values = stats.map((s) => (s.score / max) * R);
  const top = stats.reduce((b, s, i) => (s.score > stats[b].score ? i : b), 0);

  return (
    <section className="flex flex-col gap-1 rounded-2xl bg-card p-4 ring-1 ring-border" aria-labelledby="radar-title">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="radar-title" className="text-[15px] font-semibold">
          {title}
        </h2>
        <span className="text-[12px] font-medium text-muted-foreground tabular-nums">숙련도 매긴 기술 {total}개</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-sm" role="img" aria-label={AXES.map((a, i) => `${a} ${stats[i].count}개`).join(", ")}>
        {[1 / 3, 2 / 3, 1].map((k) => (
          <polygon key={k} points={poly(AXES.map(() => R * k))} className="fill-none stroke-border" strokeWidth={1} />
        ))}
        {AXES.map((_, i) => {
          const [x, y] = point(i, R);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} className="stroke-border" strokeWidth={1} />;
        })}
        {total > 0 && (
          <>
            <polygon points={poly(values)} className="fill-accent/70 stroke-foreground" strokeWidth={1.5} strokeLinejoin="round" />
            {values.map((r, i) => {
              const [x, y] = point(i, r);
              return <circle key={i} cx={x} cy={y} r={2.5} className="fill-foreground" />;
            })}
          </>
        )}
        {AXES.map((a, i) => {
          const [x, y] = point(i, R + 22);
          const anchor = Math.abs(x - CX) < 4 ? "middle" : x > CX ? "start" : "end";
          const dx = anchor === "start" ? -6 : anchor === "end" ? 6 : 0;
          return (
            <text key={a} x={x + dx} y={y} textAnchor={anchor} dominantBaseline="middle" className="text-[12px]">
              <tspan className={total > 0 && i === top ? "fill-foreground font-bold" : "fill-foreground font-semibold"}>{a}</tspan>
              <tspan x={x + dx} dy={15} className="fill-muted-foreground text-[11px] tabular-nums">
                {stats[i].count}개
              </tspan>
            </text>
          );
        })}
      </svg>
      <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
        {total === 0
          ? emptyText
          : "숙련도를 매긴 기술이 많고 높을수록 그쪽으로 커져요."}
      </p>
    </section>
  );
}
