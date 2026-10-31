"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { isKnownBelt } from "@/components/open-mat/colors";

// 온라인 오픈매트 실시간 연결(D-88). Supabase Realtime 하나로:
// - presence: 매트에 누가 있는지(들어올 때 한 번만 올린다). 위치를 여기 다시 올리면 받는 쪽에서 '나갔다 → 들어왔다'로 보여
//   캐릭터가 사라졌다 생기고 '들어왔어요' 알림이 떠서(2026-10-31 신고 "상대가 돌아다니면 접속이 끊어져"), 걷기는 broadcast 로 보낸다
// - broadcast: 걷기(move) · 동작(오스 · 콤파치 · 탭) · 앉은 자세(stance: 탑 · 가드) — 받은 쪽에서 캐릭터를 움직이고 알림을 띄운다
// - postgres_changes: 기록 알림(open_mat_events 새 줄, 별명 + 기술 이름만)

export const ROOM_SIZE = 12;
const MAX_ROOMS = 30;
export const MAT_HALF = 4.6; // 매트 안쪽 반 너비 — 이 안에서만 걷는다

export type Act = "oss" | "fistbump" | "tap";
export const ACT_LABEL: Record<Act, string> = { oss: "오스로 인사했어요", fistbump: "콤파치를 했어요", tap: "탭을 쳤어요" };

// 앉은 자세(본인 요청 2026-10-31 "탑, 가드 넣어서 앉았다 일어났다") — 다시 누르거나 걸으면 일어선다
export type Stance = "stand" | "guard" | "top";
export const STANCE_LABEL: Record<Exclude<Stance, "stand">, string> = { guard: "가드 자세로 앉았어요", top: "탑 자세를 잡았어요" };
const isStance = (v: unknown): v is Stance => v === "stand" || v === "guard" || v === "top";

export type Me = { id: string; nickname: string; belt: string; member: boolean; announce: boolean };
export type Player = { id: string; nickname: string; belt: string; x: number; z: number; stance: Stance };
export type Toast = { id: number; text: string; mine?: boolean };
export type ActEvent = { id: number; player: string; act: Act };
export type Status = "connecting" | "ready" | "reconnecting" | "full" | "error";

const clamp = (v: number) => Math.max(-MAT_HALF, Math.min(MAT_HALF, v));
// 세로 휴대폰 화면 안에 보이게 가운데 근처에서 시작
const spawn = () => ({ x: clamp((Math.random() - 0.5) * 4), z: clamp((Math.random() - 0.5) * 3) }); // 가운데 근처 — 서로 카메라에 잘 보이게

// 받침이 있으면 "을", 없으면 "를"(한글이 아니면 둘 다)
const objectParticle = (word: string) => {
  const c = word.trim().at(-1)?.charCodeAt(0) ?? 0;
  if (c < 0xac00 || c > 0xd7a3) return "을(를)";
  return (c - 0xac00) % 28 ? "을" : "를";
};

type PresencePayload = { id: string; nickname: string; belt: string; x: number; z: number };

export function useMat() {
  const [me, setMe] = useState<Me | null>(null);
  const [room, setRoom] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [acts, setActs] = useState<ActEvent[]>([]);
  const channel = useRef<RealtimeChannel | null>(null);
  const self = useRef<PresencePayload | null>(null);
  const seq = useRef(0);
  const lastAct = useRef(0);
  const lastMove = useRef(0);
  const spots = useRef(new Map<string, { x: number; z: number }>()); // 걷기로 바뀐 자리(id → 목표) — 명단의 처음 자리보다 우선
  const stances = useRef(new Map<string, Stance>()); // 앉은 자세(id → 자세), 없으면 서 있음
  const lastStance = useRef(0);

  const toast = useCallback((text: string, mine = false) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, text, mine }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const play = useCallback((player: string, act: Act) => {
    const id = ++seq.current;
    setActs((a) => [...a.filter((x) => x.player !== player), { id, player, act }]);
    setTimeout(() => setActs((a) => a.filter((x) => x.id !== id)), 1600);
  }, []);

  useEffect(() => {
    // 매트 전용 연결 — 하트비트(연결 유지 신호)를 웹 워커에서 보내, 다른 창에 가려지거나 최소화된 브라우저가
    // 타이머를 늦춰도 서버가 연결을 끊지 않게 한다(2026-10-31 "한쪽 브라우저에서 접속이 끊어져"). 로그인은 같은 쿠키를 읽는다.
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { isSingleton: false, realtime: { worker: true } },
    );
    let alive = true;
    let joined: RealtimeChannel | null = null;

    async function start() {
      // 별명 · 띠는 서버 함수가 정한다(로그인했으면 오늘 별명 + 내 벨트, 아니면 무작위 + 흰 띠)
      const { data, error } = await supabase.rpc("open_mat_me");
      if (!alive) return;
      if (error || !data) return setStatus("error");
      const d = data as Record<string, unknown>;
      const mine: Me = {
        id: crypto.randomUUID(),
        nickname: String(d.nickname ?? "익명 수련자"),
        belt: isKnownBelt(d.belt) ? d.belt : "white",
        member: d.member === true,
        announce: d.announce === true,
      };
      setMe(mine);
      self.current = { id: mine.id, nickname: mine.nickname, belt: mine.belt, ...spawn() };

      // 빈 자리가 있는 매트를 앞에서부터 찾는다. 받을 일(sync · join · 동작)은 들어가기 전에 모두 걸어 둔다(들어간 뒤엔 못 건다)
      let failures = 0;
      for (let n = 1; n <= MAX_ROOMS && alive; n++) {
        const ch = supabase.channel(`open-mat-${n}`, { config: { presence: { key: mine.id }, broadcast: { self: false } } });
        let probing = true;
        let firstSync: (count: number) => void = () => {};
        const synced = new Promise<number>((resolve) => (firstSync = resolve));

        const sync = () => {
          const state = ch.presenceState<PresencePayload>();
          if (probing) return firstSync(Object.keys(state).length);
          const list: Player[] = [];
          for (const metas of Object.values(state)) {
            const p = metas[metas.length - 1];
            if (p && typeof p.id === "string") {
              const at = spots.current.get(p.id);
              list.push({
                id: p.id,
                nickname: String(p.nickname).slice(0, 20),
                belt: isKnownBelt(p.belt) ? p.belt : "white",
                x: clamp(at?.x ?? (Number(p.x) || 0)),
                z: clamp(at?.z ?? (Number(p.z) || 0)),
                stance: stances.current.get(p.id) ?? "stand",
              });
            }
          }
          setPlayers(list.slice(0, ROOM_SIZE + 4));
        };
        ch.on("presence", { event: "sync" }, sync);
        ch.on("presence", { event: "join" }, ({ key, currentPresences, newPresences }) => {
          if (probing || key === mine.id || currentPresences.length) return; // 이미 있던 사람(다시 연결)은 알림 없이
          const p = newPresences[0] as unknown as PresencePayload | undefined;
          if (p) toast(`${p.nickname}님이 매트에 들어왔어요`);
          // 새로 온 사람은 내 지금 자리를 모르니 한 번 알려 준다
          if (self.current) void ch.send({ type: "broadcast", event: "move", payload: { id: mine.id, x: self.current.x, z: self.current.z } });
          const st = stances.current.get(mine.id);
          if (st && st !== "stand") void ch.send({ type: "broadcast", event: "stance", payload: { id: mine.id, stance: st } });
        });
        ch.on("presence", { event: "leave" }, ({ key, currentPresences }) => {
          if (!currentPresences.length) {
            spots.current.delete(key);
            stances.current.delete(key);
          }
        });
        ch.on("broadcast", { event: "move" }, ({ payload }) => {
          if (probing || typeof payload?.id !== "string" || payload.id === mine.id) return;
          const x = clamp(Number(payload.x) || 0);
          const z = clamp(Number(payload.z) || 0);
          spots.current.set(payload.id, { x, z });
          stances.current.delete(payload.id); // 걸으면 일어선다
          setPlayers((ps) => ps.map((p) => (p.id === payload.id ? { ...p, x, z, stance: "stand" } : p)));
        });
        ch.on("broadcast", { event: "stance" }, ({ payload }) => {
          const stance = payload?.stance;
          if (probing || !isStance(stance) || typeof payload?.id !== "string" || payload.id === mine.id) return;
          const who = ch.presenceState<PresencePayload>()[payload.id]?.at(-1);
          stances.current.set(payload.id, stance);
          setPlayers((ps) => ps.map((p) => (p.id === payload.id ? { ...p, stance } : p)));
          if (who && stance !== "stand") toast(`${who.nickname}님이 ${STANCE_LABEL[stance]}`);
        });
        ch.on("broadcast", { event: "act" }, ({ payload }) => {
          const act = payload?.act as Act;
          if (probing || !(act in ACT_LABEL) || typeof payload?.id !== "string") return;
          const who = ch.presenceState<PresencePayload>()[payload.id]?.at(-1);
          if (!who) return;
          play(payload.id, act);
          toast(`${who.nickname}님이 ${ACT_LABEL[act]}`);
        });

        const count = await new Promise<number>((resolve) => {
          let done = false;
          const finish = (v: number) => !done && ((done = true), resolve(v));
          void synced.then(finish);
          ch.subscribe((s, err) => {
            // 휴대폰이 잠깐 백그라운드에 갔다 오면 연결이 다시 붙는다 — 그때 내 자리를 다시 알린다(안 하면 남에게 안 보임)
            if (s === "SUBSCRIBED" && !probing && self.current) void ch.track(self.current);
            if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
              console.error("open-mat channel:", s, err?.message ?? "");
              finish(-1);
            }
          });
          setTimeout(() => finish(Object.keys(ch.presenceState()).length), 2500);
        });
        if (count < 0) {
          // 연결이 잠깐 끊긴 것일 수 있어 같은 매트로 세 번까지 다시
          await supabase.removeChannel(ch);
          if (++failures > 3) return alive && setStatus("error");
          await new Promise((r) => setTimeout(r, 1000 * failures));
          n--;
          continue;
        }
        if (count >= ROOM_SIZE || !alive) {
          await supabase.removeChannel(ch);
          continue;
        }
        probing = false;
        joined = ch;
        channel.current = ch;
        await ch.track(self.current!);
        sync();
        break;
      }
      if (!alive) return;
      if (!joined) return setStatus("full");
      const ch = joined;
      setRoom(Number(ch.topic.split("-").at(-1)));
      setStatus("ready");
    }

    // 기록 알림 — 매트 어디서든 같은 알림
    const events = supabase
      .channel("open-mat-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "open_mat_events" }, ({ new: row }) => {
        const r = row as { nickname?: string; technique_names?: string[] };
        const names = (r.technique_names ?? []).slice(0, 2).join(" · ");
        toast(names ? `${r.nickname}님이 ${names}${objectParticle(names)} 기록했어요` : `${r.nickname}님이 오늘 수련을 기록했어요`);
      })
      .subscribe((s, err) => {
        if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") console.error("open-mat events:", s, err?.message ?? "");
      });

    start().catch((e) => {
      console.error("open-mat start:", e instanceof Error ? e.message : "unknown");
      if (alive) setStatus("error");
    });
    const onOffline = () => setStatus("reconnecting");
    const onOnline = () => setStatus((s) => (s === "reconnecting" ? "ready" : s));
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      alive = false;
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      if (joined) void supabase.removeChannel(joined);
      void supabase.removeChannel(events);
      channel.current = null;
    };
  }, [toast, play]);

  const moveTo = useCallback((x: number, z: number) => {
    const ch = channel.current;
    if (!ch || !self.current) return;
    const now = Date.now();
    if (now - lastMove.current < 250) return; // 너무 잦은 전송 막기
    lastMove.current = now;
    self.current = { ...self.current, x: clamp(x), z: clamp(z) };
    const { id, x: nx, z: nz } = self.current;
    spots.current.set(id, { x: nx, z: nz });
    stances.current.delete(id); // 걸으면 일어선다(받는 쪽도 move 를 받으면 일으킨다)
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, x: nx, z: nz, stance: "stand" } : p)));
    void ch.send({ type: "broadcast", event: "move", payload: { id, x: nx, z: nz } }); // 명단(presence)은 건드리지 않는다
  }, []);

  const doAct = useCallback(
    (act: Act) => {
      const ch = channel.current;
      if (!ch || !self.current) return;
      const now = Date.now();
      if (now - lastAct.current < 1200) return;
      lastAct.current = now;
      play(self.current.id, act);
      toast(`나 · ${ACT_LABEL[act]}`, true);
      void ch.send({ type: "broadcast", event: "act", payload: { id: self.current.id, act } });
    },
    [play, toast],
  );

  // 탑 · 가드: 누르면 그 자세로 앉고, 같은 버튼을 다시 누르면 일어선다
  const toggleStance = useCallback(
    (want: Exclude<Stance, "stand">) => {
      const ch = channel.current;
      if (!ch || !self.current) return;
      const now = Date.now();
      if (now - lastStance.current < 500) return;
      lastStance.current = now;
      const id = self.current.id;
      const stance: Stance = stances.current.get(id) === want ? "stand" : want;
      stances.current.set(id, stance);
      setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, stance } : p)));
      if (stance !== "stand") toast(`나 · ${STANCE_LABEL[stance]}`, true);
      void ch.send({ type: "broadcast", event: "stance", payload: { id, stance } });
    },
    [toast],
  );

  return { me, room, players, status, toasts, acts, moveTo, doAct, toggleStance, setMe };
}
