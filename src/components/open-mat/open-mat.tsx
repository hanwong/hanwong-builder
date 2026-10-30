"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Hand, HandMetal, LogOut, Settings2, Users } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";
import { ROOM_SIZE, useMat, type Act } from "@/components/open-mat/use-mat";

// 온라인 오픈매트 화면(D-88, FLOW `/open-mat`). 3D 는 브라우저에서만 그린다(ssr: false).
const MatScene = dynamic(() => import("@/components/open-mat/scene"), { ssr: false, loading: () => <Center text="매트를 까는 중…" /> });

function Center({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-[15px] font-medium text-muted-foreground">{text}</div>;
}

const webgl = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

const ACTS: { act: Act; label: string; Icon: typeof Hand }[] = [
  { act: "oss", label: "오스", Icon: Hand },
  { act: "highfive", label: "하이파이브", Icon: HandMetal },
  { act: "tap", label: "탭", Icon: Hand },
];

export function OpenMat() {
  const { me, room, players, status, toasts, acts, moveTo, doAct, setMe } = useMat();
  const [canDraw] = useState(() => (typeof window === "undefined" ? true : webgl()));
  const [settings, setSettings] = useState(false);

  // '내 기록 알리기'(로그인한 사람만) — 로그인 계정 정보에 끈 상태만 둔다(user_metadata.open_mat_quiet)
  async function toggleAnnounce(on: boolean) {
    if (!me) return;
    setMe({ ...me, announce: on });
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ data: { open_mat_quiet: !on } });
    if (error) return setMe({ ...me, announce: !on });
    await supabase.auth.refreshSession(); // 서버 함수가 읽는 토큰에 바로 반영
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <div className="absolute inset-0">
        {!canDraw ? (
          <Center text="이 기기에서는 매트를 그릴 수 없어요." />
        ) : status === "error" ? (
          <Center text="매트에 들어가지 못했어요. 잠시 뒤 새로고침해 주세요." />
        ) : status === "full" ? (
          <Center text="모든 매트가 꽉 찼어요. 잠시 뒤 다시 와 주세요." />
        ) : (
          <MatScene players={players} myId={me?.id ?? null} acts={acts} onPick={moveTo} />
        )}
      </div>

      {/* 위: 나가기 · 매트 번호 / 사람 수 · 설정 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-4 ring-1 ring-border">
          <Link href={me?.member ? "/app" : "/"} aria-label="나가기" className="flex size-8 items-center justify-center rounded-full hover:bg-muted">
            <LogOut className="size-4 rotate-180" aria-hidden />
          </Link>
          <span className="text-[15px] font-semibold">오픈매트</span>
          {room && <span className="text-[13px] font-medium text-muted-foreground tabular-nums">{room}번</span>}
        </div>
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-card px-3 py-1.5 ring-1 ring-border">
          <Users className="size-4" aria-hidden />
          <span className="text-[13px] font-semibold tabular-nums" aria-label={`지금 ${players.length}명`}>
            {players.length}/{ROOM_SIZE}
          </span>
          {me?.member && (
            <button
              type="button"
              onClick={() => setSettings((v) => !v)}
              aria-label="설정"
              aria-expanded={settings}
              className="ml-1 flex size-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <Settings2 className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {settings && me?.member && (
        <div className="absolute right-4 top-16 w-64 rounded-2xl bg-card p-4 ring-1 ring-border">
          <label className="flex items-center justify-between gap-3 text-[15px] font-medium">
            내 기록 알리기
            <Switch checked={me.announce} onCheckedChange={toggleAnnounce} />
          </label>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            기록을 저장하면 매트에 &ldquo;{me.nickname}님이 [배운 기술]을 기록했어요&rdquo;가 떠요. 별명은 날마다 바뀌고, 메모는 보이지 않아요.
          </p>
        </div>
      )}

      {/* 알림 */}
      <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-20 flex flex-col items-center gap-2 px-4">
        {status === "connecting" && <Note text="빈 매트를 찾는 중…" />}
        {status === "reconnecting" && <Note text="다시 연결하는 중…" />}
        {toasts.map((t) => (
          <Note key={t.id} text={t.text} />
        ))}
      </div>

      {/* 아래: 동작 버튼 + 안내 */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {status === "ready" && (
          <p className="pointer-events-none text-[12px] font-medium text-muted-foreground">매트를 누르면 걸어가요 · 끌어서 둘러보기</p>
        )}
        <div className="flex items-center gap-1 rounded-full bg-card p-1.5 ring-1 ring-border">
          {ACTS.map(({ act, label, Icon }) => (
            <button
              key={act}
              type="button"
              disabled={status !== "ready"}
              onClick={() => doAct(act)}
              className="flex min-w-20 flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-[13px] font-semibold hover:bg-muted disabled:opacity-40"
            >
              <Icon className={`size-5 ${act === "tap" ? "rotate-90" : ""}`} strokeWidth={1.75} aria-hidden />
              {label}
            </button>
          ))}
        </div>
        {me && !me.member && (
          <Link href="/app/login?next=/open-mat" className="text-[12px] font-medium text-muted-foreground underline underline-offset-4">
            로그인하면 내 띠 색으로 · 기록하러 가기
          </Link>
        )}
      </div>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return <p className="rounded-full bg-card px-4 py-2 text-[13px] font-medium ring-1 ring-border">{text}</p>;
}
