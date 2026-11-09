import { WEEKDAY_KO } from "@/lib/gym-shared";
import type { Schedule } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // 월~일

// 끝 시각 'HH:MM'
function endOf(start: string, minutes: number): string {
  const [h, m] = start.split(":").map(Number);
  const t = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

// 칸 색(D-135) — 이름으로 갈래만 나눈다. 어린이 · 유소년 = 노랑, 초보 · 기본반 = 연두, 나머지 = 흰 칸
function tone(name: string): string {
  if (/어린이|유소년|키즈|유아|kids/i.test(name)) return "bg-class-kids";
  if (/초보|기본|basic|입문/i.test(name)) return "bg-class-basic";
  return "bg-card";
}

// 수업 시간표 (D-135, DESIGN '관장님 버전') — 시간 줄 × 요일 칸. 같은 시각 · 길이 수업은 한 줄. 칸을 누르면 그 수업 고치기
export function ScheduleTable({ schedules, onPick }: { schedules: Schedule[]; onPick: (s: Schedule) => void }) {
  if (schedules.length === 0) return null;
  // 일요일 수업이 없으면 월~토만(종이 시간표처럼)
  const days = ORDER.filter((wd) => wd !== 0 || schedules.some((s) => s.weekday === 0));
  const rows = [...new Map(schedules.map((s) => [`${s.startsAt}-${s.minutes}`, { startsAt: s.startsAt, minutes: s.minutes }])).values()].sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt) || a.minutes - b.minutes,
  );

  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-border">
      <table className="w-full min-w-[340px] table-fixed border-collapse bg-card text-center">
        <caption className="sr-only">주간 수업 시간표</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="w-[52px] py-2 text-[12px] font-semibold text-muted-foreground">
              시간
            </th>
            {days.map((wd) => (
              <th key={wd} scope="col" className={cn("py-2 text-[13px] font-semibold", wd === 6 && "text-chart-3", wd === 0 && "text-destructive")}>
                {WEEKDAY_KO[wd]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.startsAt}-${r.minutes}`} className="border-b border-border last:border-b-0">
              <th scope="row" className="px-1 py-1.5 text-[11px] leading-tight font-semibold tabular-nums">
                {r.startsAt}
                <br />
                <span className="font-medium text-muted-foreground">{endOf(r.startsAt, r.minutes)}</span>
              </th>
              {days.map((wd) => {
                const here = schedules.filter((s) => s.weekday === wd && s.startsAt === r.startsAt && s.minutes === r.minutes);
                return (
                  <td key={wd} className="border-l border-border p-0 align-middle">
                    {here.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onPick(s)}
                        aria-label={`${WEEKDAY_KO[wd]}요일 ${s.startsAt} ${s.name} 고치기`}
                        className={cn(
                          "flex min-h-11 w-full items-center justify-center px-0.5 py-1 text-[11px] leading-tight font-semibold break-keep transition-opacity hover:opacity-80",
                          tone(s.name),
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
