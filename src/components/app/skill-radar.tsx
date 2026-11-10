import { LEVELS, type Level } from "@/lib/mock/log-seed";
import type { PositionGroup } from "@/lib/skills-data";

// 내 기술 분포 레이더(D-163) — 기술 종류 10가지를 주짓수 한 판의 흐름 6갈래로 묶은 육각형.
// 축 값 = 그 갈래에서 내가 숙련도를 매긴 기술들의 숙련도 합(비기너 1 … 프로 5).
// 가장 큰 축이 바깥 끝에 닿게 맞춘다 — "얼마나 잘하나"가 아니라 "어디에 몰려 있나"(분포)를 보여 준다.
const AXES: { label: string; kinds: string[] }[] = [
  { label: "스탠딩", kinds: ["takedown", "guard_pull"] },
  { label: "가드(스윕)", kinds: ["sweep"] },
  { label: "패스", kinds: ["pass"] },
  { label: "포지션 · 백", kinds: ["control", "back_take", "transition"] },
  { label: "서브미션", kinds: ["submission"] },
  { label: "탈출 · 방어", kinds: ["escape", "defense"] },
];
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

export function SkillRadar({ groups }: { groups: PositionGroup[] }) {
  const stats = AXES.map(() => ({ count: 0, score: 0 }));
  for (const g of groups)
    for (const s of g.skills) {
      if (!s.level || !s.kind) continue;
      const i = AXES.findIndex((a) => a.kinds.includes(s.kind!));
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
          내 기술 분포
        </h2>
        <span className="text-[12px] font-medium text-muted-foreground tabular-nums">숙련도 매긴 기술 {total}개</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-sm" role="img" aria-label={AXES.map((a, i) => `${a.label} ${stats[i].count}개`).join(", ")}>
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
            <text key={a.label} x={x + dx} y={y} textAnchor={anchor} dominantBaseline="middle" className="text-[12px]">
              <tspan className={total > 0 && i === top ? "fill-foreground font-bold" : "fill-foreground font-semibold"}>{a.label}</tspan>
              <tspan x={x + dx} dy={15} className="fill-muted-foreground text-[11px] tabular-nums">
                {stats[i].count}개
              </tspan>
            </text>
          );
        })}
      </svg>
      <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
        {total === 0
          ? "기록에서 숙련도를 매기면 어느 쪽 기술이 많은지 모양이 생겨요."
          : "숙련도를 매긴 기술이 많고 높을수록 그쪽으로 커져요."}
      </p>
    </section>
  );
}
