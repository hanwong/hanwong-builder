"use client";

import { useEffect, useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, Settings, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BeltChoice } from "@/components/app/belt-choice";
import { useFloatingDialog } from "@/lib/use-floating-dialog";
import { setBelt, setNick, setStartedOn, setStripes } from "@/app/app/actions";
import { StartMonthPicker } from "@/components/app/start-month-picker";
import { GymName } from "@/components/gym/network-mark";
import { leaveGym } from "@/app/gym/actions";
import type { GymRole } from "@/lib/gym-data";
import {
  BELTS,
  BELT_BG,
  BELT_BLACK_BAR,
  BELT_ROWS,
  BELT_WEEKS,
  BELT_WHITE_EDGE,
  LIGHT_BELTS,
  STRIPE_EDGE,
  WEEK_SHADES,
  maxStripes,
  trainingSpan,
  type Belt,
} from "@/lib/belt";
import { NICK_MAX, cleanNick } from "@/lib/nickname";
import { formatKoreanDate } from "@/lib/seoul-date";

// 이 탭에서 물결을 이미 보여 줬나(서버에서는 늘 false — 바꾸는 건 브라우저 effect 에서만)
let wavePlayed = false;
const WAVE_STEP = 45; // 세로줄(주) 사이 간격 ms — 26줄이면 약 1.2초에 걸쳐 지나간다

// 홈 "수련 벨트" (D-33, DESIGN 2) — 최근 2년(104주)을 1주 1칸으로, 그 주 수련(기록) 횟수만큼 밝게.
// 바깥은 내 벨트 색(양옆 너비의 약 5%, 위아래 높이의 약 1%), 가운데는 검정 바탕 + 살짝 둥근 네모.
// 위에 "○○ 벨트 · 수련 N년 N개월째"(D-59) + 오른쪽 끝 톱니바퀴(내 설정 팝업: 닉네임 · 벨트 색 · 수련 시작), 아래에 범례 · 최근 2년 횟수.
export function TrainingBelt({
  weeks,
  belt: initialBelt,
  stripes: initialStripes,
  startedOn: initialStartedOn,
  nick: initialNick,
  defaultNick,
  thisMonth,
  gyms = [],
}: {
  weeks: { start: string; count: number }[];
  belt: Belt;
  stripes: number;
  startedOn: string | null;
  nick: string;
  defaultNick: string;
  thisMonth: string;
  gyms?: { id: string; name: string; network: string | null; role: GymRole }[];
}) {
  const [belt, setBeltState] = useState<Belt>(initialBelt);
  const [stripes, setStripesState] = useState(initialStripes);
  const [startedOn, setStartedOnState] = useState(initialStartedOn);
  const [savedNick, setSavedNick] = useState(initialNick);
  const [nickDraft, setNickDraft] = useState(initialNick);
  const [picking, setPicking] = useState(false);
  // 벨트 물결(D-65) — 이 탭에서 홈을 처음 열 때 한 번(띠를 누르면 기록 달력으로 가서 다시 돌리지 않음, D-99)
  const [wave] = useState(() => (wavePlayed ? 0 : 1));
  useEffect(() => {
    wavePlayed = true;
  }, []);
  const floating = useFloatingDialog(picking);
  const [, startSaving] = useTransition();

  const total = weeks.reduce((n, w) => n + w.count, 0);
  const color = BELTS.find((b) => b.value === belt)?.color ?? BELTS[0].color;
  const label = BELTS.find((b) => b.value === belt)?.label ?? "화이트";

  function choose(next: Belt) {
    const prev = belt;
    const prevStripes = stripes;
    setBeltState(next);
    setStripesState((n) => Math.min(n, maxStripes(next))); // 서버도 같은 규칙으로 맞춘다
    startSaving(async () => {
      const res = await setBelt(next).catch(() => null);
      if (!res?.ok) {
        setBeltState(prev);
        setStripesState(prevStripes);
        toast.error("벨트 색을 저장하지 못했어요. 다시 눌러 주세요.");
      }
    });
  }

  // 그랄(D-131) — 스파링처럼 −/+, 누를 때마다 저장
  function changeStripes(next: number) {
    if (next < 0 || next > maxStripes(belt)) return;
    const prev = stripes;
    setStripesState(next);
    startSaving(async () => {
      const res = await setStripes(next).catch(() => null);
      if (!res?.ok) {
        setStripesState(prev);
        toast.error("그랄을 저장하지 못했어요. 다시 눌러 주세요.");
      }
    });
  }

  function changeStart(next: string) {
    if (next && next > thisMonth) return; // 이번 달까지
    const prev = startedOn;
    const value = next || null;
    setStartedOnState(value);
    startSaving(async () => {
      const res = await setStartedOn(value).catch(() => null);
      if (!res?.ok) {
        setStartedOnState(prev);
        toast.error("수련 시작을 저장하지 못했어요. 다시 골라 주세요.");
      }
    });
  }

  // 닉네임(D-122) — 칸을 벗어나거나 팝업을 닫으면 저장
  function saveNick() {
    const value = cleanNick(nickDraft);
    if (value === null || value === savedNick) return;
    const prev = savedNick;
    setSavedNick(value);
    setNickDraft(value);
    startSaving(async () => {
      const res = await setNick(value).catch(() => null);
      if (!res?.ok) {
        setSavedNick(prev);
        toast.error("닉네임을 저장하지 못했어요. 다시 적어 주세요.");
      }
    });
  }

  function toggleSettings(open: boolean) {
    if (!open) saveNick();
    setPicking(open);
  }

  return (
    <section className="flex flex-col gap-2" aria-label="수련 벨트">
      {/* 수련 기간 (D-59) + 오른쪽 끝 내 설정(톱니바퀴) */}
      <div className="flex items-center gap-2">
        {startedOn ? (
          <p className="min-w-0 flex-1 text-[15px] font-semibold">
            {label} 벨트{stripes > 0 && ` ${stripes}그랄`} · <span className="mark-lime">{trainingSpan(startedOn, thisMonth)}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="min-w-0 flex-1 text-left text-[13px] font-medium text-muted-foreground underline underline-offset-4"
          >
            수련 시작을 알려 주면 몇 년째인지 보여 드려요
          </button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="내 설정"
          className="-mr-1.5 shrink-0 rounded-full text-muted-foreground"
          onClick={() => setPicking(true)}
        >
          <Settings />
        </Button>
      </div>
      {/* 벨트: 바깥 = 벨트 색, 위아래는 높이의 약 1%(≈ 너비의 0.17%). 누르면 기록 달력(D-99 · D-106) */}
      <Link
        href="/app/logs/cal"
        className="relative block rounded-[3px] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{
          backgroundColor: color,
          padding: "max(1px, 0.17%) 5%",
          // 화이트는 크림 바탕에 묻혀서 벨트 전체에 테두리(D-35)
          boxShadow: belt === "white" ? `0 0 0 1px ${BELT_WHITE_EDGE}` : undefined,
        }}
        aria-label={`${label} 벨트${stripes > 0 ? ` ${stripes}그랄` : ""}, 최근 2년 동안 ${total}번 수련 — 누르면 기록 달력`}
      >
        <div
          className="grid gap-[2px] p-[3px]"
          style={{
            // 블랙은 칸지 랭크바처럼 가운데 바탕만 빨강, 칸 색은 그대로(D-35)
            backgroundColor: belt === "black" ? BELT_BLACK_BAR : BELT_BG,
            gridTemplateColumns: `repeat(${BELT_WEEKS / BELT_ROWS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${BELT_ROWS}, auto)`,
            gridAutoFlow: "column",
          }}
        >
          {/* 칸들이 세로줄(주) 단위로 밝아졌다 돌아오며 왼쪽에서 오른쪽으로 지나간다(D-65).
              같은 세로줄 4칸은 같은 시각에 같은 정도로 */}
          {weeks.map((w, i) => (
            <span
              key={`${wave}-${w.start}`}
              title={`${formatKoreanDate(w.start)} 주 · ${w.count}번`}
              className={cn("aspect-square rounded-[2px]", wave > 0 && "belt-wave")}
              style={
                {
                  backgroundColor: WEEK_SHADES[Math.min(w.count, 5)],
                  "--week": WEEK_SHADES[Math.min(w.count, 5)],
                  animationDelay: wave > 0 ? `${Math.floor(i / BELT_ROWS) * WAVE_STEP}ms` : undefined,
                } as CSSProperties
              }
            />
          ))}
        </div>
        {/* 그랄(D-133) — 오른쪽 벨트 색 부분에 위에서 아래로 쌓은 흰 줄. 밝은 벨트(화이트 · 옐로)는 진한 회색 테두리로 */}
        {stripes > 0 && (
          <span
            aria-hidden
            className="absolute inset-y-0 right-0 flex w-[5%] flex-col items-center justify-center"
            // 간격은 고정 px — 화면 너비(vw) 기준이면 PC 에서 줄이 위아래로 벌어짐(D-187)
            style={{ gap: stripes > 4 ? 1 : 2 }}
          >
            {Array.from({ length: stripes }, (_, i) => (
              <span
                key={i}
                className="w-[62%] rounded-[1px] bg-white"
                style={{
                  height: stripes > 4 ? 2 : 3,
                  boxShadow: LIGHT_BELTS.includes(belt) ? `0 0 0 1px ${STRIPE_EDGE}` : undefined,
                }}
              />
            ))}
          </span>
        )}
      </Link>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground" aria-hidden>
          적게
          {WEEK_SHADES.map((c) => (
            <span key={c} className="size-2.5 rounded-[2px] ring-1 ring-border" style={{ backgroundColor: c }} />
          ))}
          주 5번+
        </span>
        <span className="text-[13px] font-medium text-muted-foreground tabular-nums">최근 2년 · {total}번</span>
      </div>

      {/* 내 설정 — 기술 고르기와 같은 떠 있는 팝업(T-35) */}
      <Dialog open={picking} onOpenChange={toggleSettings}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          // 칸들만 팝업 안에서 위아래로 스크롤(D-132), "완료"는 아래 고정(D-139)
          style={{ ...floating, display: "flex", flexDirection: "column", gap: "14px", padding: "14px", overscrollBehavior: "contain" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[17px] font-semibold">내 설정</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label="닫기"
              className="-mr-1 rounded-full"
              onClick={() => toggleSettings(false)}
            >
              <X />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            닉네임, 벨트 색, 그랄, 수련을 시작한 연도 · 달을 바꿔요. 바꾸면 바로 저장돼요.
          </DialogDescription>
          <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto overscroll-contain px-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nick-setting" className="text-[15px] font-semibold">
              닉네임
            </Label>
            <Input
              id="nick-setting"
              value={nickDraft}
              maxLength={NICK_MAX}
              autoComplete="off"
              placeholder={defaultNick || "실명이 아니어도 돼요"}
              className="h-11 rounded-xl px-3"
              onChange={(e) => setNickDraft(e.target.value)}
              onBlur={saveNick}
            />
            {defaultNick && (
              <p className="text-[13px] font-medium text-muted-foreground">
                비워 두면 이메일 앞부분({defaultNick})으로 써요.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span id="belt-setting-label" className="text-[15px] font-semibold">
              지금 벨트
            </span>
            <BeltChoice value={belt} onChange={choose} labelledBy="belt-setting-label" />
          </div>
          {/* 그랄(D-131) — 기록 화면 스파링과 같은 −/+ */}
          <div className="flex items-center justify-between gap-3">
            <span id="stripes-setting-label" className="flex flex-col">
              <span className="text-[15px] font-semibold">그랄</span>
              <span className="text-[12px] font-medium text-muted-foreground">최대 {maxStripes(belt)}개{belt === "black" ? "(블랙)" : ""}</span>
            </span>
            <div className="flex items-center gap-2" role="group" aria-labelledby="stripes-setting-label">
              <Button
                variant="outline"
                size="icon"
                aria-label="그랄 하나 빼기"
                className="size-10 rounded-full shadow-none"
                disabled={stripes === 0}
                onClick={() => changeStripes(stripes - 1)}
              >
                <Minus />
              </Button>
              <span className="w-14 text-center text-[17px] font-semibold tabular-nums" aria-live="polite">
                {stripes}그랄
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="그랄 하나 더하기"
                className="size-10 rounded-full shadow-none"
                disabled={stripes >= maxStripes(belt)}
                onClick={() => changeStripes(stripes + 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-semibold">주짓수를 시작한 때</span>
            <StartMonthPicker
              idPrefix="belt-start"
              value={startedOn ?? ""}
              thisMonth={thisMonth}
              onChange={(v) => v && changeStart(v)}
            />
            <p className="text-[13px] font-medium text-muted-foreground">
              {startedOn ? `${trainingSpan(startedOn, thisMonth)}로 보여요.` : "연도와 달을 고르면 바로 저장돼요."}
            </p>
          </div>
          {gyms.length > 0 && <MyGyms gyms={gyms} />}
          </div>
          <Button className="h-12 w-full shrink-0 rounded-full text-base shadow-none" onClick={() => toggleSettings(false)}>
            완료
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// 내 설정 · 내 체육관 (D-156, FLOW 8) — 들어가 있는 체육관 목록과 "나가기". 누르면 그 줄에서 한 번 더 묻는다.
// 나가면 관장 · 코치가 그때부터 내 기록을 못 본다. 내 기록은 그대로. 관장은 여기서 못 나감(체육관 설정에서 관장 넘기기 · 지우기)
function MyGyms({ gyms }: { gyms: { id: string; name: string; network: string | null; role: GymRole }[] }) {
  const router = useRouter();
  const [asking, setAsking] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function leave(id: string) {
    start(async () => {
      const res = await leaveGym(id).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "나가지 못했어요. 다시 눌러 주세요.");
        return;
      }
      setAsking(null);
      toast.success("체육관에서 나왔어요");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold">내 체육관</span>
      <ul className="flex flex-col gap-2">
        {gyms.map((g) => (
          <li key={g.id} className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <GymName name={g.name} network={g.network} className="flex-1 text-[15px] font-medium" />
              {g.role === "owner" ? (
                <span className="shrink-0 text-[13px] font-medium text-muted-foreground">관장</span>
              ) : (
                asking !== g.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 rounded-full text-destructive"
                    disabled={busy}
                    onClick={() => setAsking(g.id)}
                  >
                    나가기
                  </Button>
                )
              )}
            </div>
            {asking === g.id && (
              <>
                <p className="text-[14px] leading-relaxed">
                  나가면 그때부터 관장님 · 코치가 내 기록을 볼 수 없어요. 내 기록은 그대로 남아요. 다시 들어가려면 가입 코드가 필요해요.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="h-10 flex-1 rounded-full shadow-none" disabled={busy} onClick={() => setAsking(null)}>
                    아니요
                  </Button>
                  <Button variant="destructive" className="h-10 flex-1 rounded-full" disabled={busy} onClick={() => leave(g.id)}>
                    {busy && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
                    나가기
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {gyms.some((g) => g.role === "owner") && (
        <p className="text-[13px] font-medium text-muted-foreground">관장인 체육관은 체육관 설정에서 관장을 넘기거나 지울 수 있어요.</p>
      )}
    </div>
  );
}
