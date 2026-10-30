import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { MAT, beltColor } from "@/components/open-mat/colors";
import type { Act, ActEvent, Player } from "@/components/open-mat/use-mat";

// 오픈매트 3D(D-88, DESIGN '온라인 오픈매트') — 모델 파일 없이 기본 도형으로 그린 2등신 도복 캐릭터와 매트 방.
// 휴대폰 성능: 그림자 · 반사 없음, 빛 둘, 도형 조각 수 적게, 화면 배율 최대 1.75.

const ROOM = 6.6; // 방 반 너비 — 벽까지. 걷는 곳(use-mat 의 MAT_HALF)보다 조금 넓게
const WALL_H = 4.2;
const PAD_H = 2;

// 체육관 방(본인이 보낸 사진 분위기 — 파란 매트 · 흰 벽 패드 · 어두운 천장 · 길게 이어진 조명). 로고 · 상표는 넣지 않는다
function Room({ onPick }: { onPick: (x: number, z: number) => void }) {
  // 매트 이음선(1m 칸)
  const lines = useMemo(() => {
    const pts: number[] = [];
    for (let i = -Math.floor(ROOM); i <= Math.floor(ROOM); i++) {
      pts.push(i, 0.006, -ROOM, i, 0.006, ROOM, -ROOM, 0.006, i, ROOM, 0.006, i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // 끌어서 둘러본 것은 걷기가 아님
    e.stopPropagation();
    onPick(e.point.x, e.point.z);
  };

  // 벽 셋(뒤 · 왼쪽 · 오른쪽) — 카메라 쪽은 비워 둔다
  const walls = [
    { p: [0, 0, -ROOM] as const, r: 0 },
    { p: [-ROOM, 0, 0] as const, r: Math.PI / 2 },
    { p: [ROOM, 0, 0] as const, r: -Math.PI / 2 },
  ];
  const pads = Array.from({ length: Math.round(ROOM * 2) }, (_, i) => -ROOM + 0.5 + i);

  return (
    <group>
      {/* 파란 매트(벽까지 꽉) */}
      <mesh rotation-x={-Math.PI / 2} onClick={click}>
        <planeGeometry args={[ROOM * 2, ROOM * 2]} />
        <meshLambertMaterial color={MAT.mat} />
      </mesh>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={MAT.matLine} />
      </lineSegments>

      {walls.map((w, i) => (
        <group key={i} position={w.p} rotation-y={w.r}>
          {/* 위쪽 옅은 회색 벽 */}
          <mesh position-y={WALL_H / 2}>
            <planeGeometry args={[ROOM * 2, WALL_H]} />
            <meshLambertMaterial color={MAT.wall} />
          </mesh>
          {/* 흰 벽 패드 — 1m 폭, 틈이 보이게 조금 띄움 */}
          <mesh position={[0, PAD_H / 2, 0.01]}>
            <planeGeometry args={[ROOM * 2, PAD_H]} />
            <meshLambertMaterial color={MAT.padGap} />
          </mesh>
          {pads.map((x) => (
            <mesh key={x} position={[x, PAD_H / 2, 0.09]}>
              <boxGeometry args={[0.96, PAD_H, 0.16]} />
              <meshLambertMaterial color={MAT.pad} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 어두운 천장 + 덕트 + 비스듬히 길게 이어진 조명 — 카메라가 천장 위로 올라가면 가리지 않게 숨긴다 */}
      <Ceiling />
    </group>
  );
}

function Ceiling() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (g.current) g.current.visible = camera.position.y < WALL_H - 0.2;
  });
  return (
    <group ref={g}>
      <mesh rotation-x={Math.PI / 2} position-y={WALL_H}>
        <planeGeometry args={[ROOM * 2, ROOM * 2]} />
        <meshBasicMaterial color={MAT.ceiling} />
      </mesh>
      {[-2.5, 2.5].map((x) => (
        <mesh key={x} position={[x, WALL_H - 0.35, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.22, 0.22, ROOM * 2, 10]} />
          <meshLambertMaterial color={MAT.duct} />
        </mesh>
      ))}
      {[-3.6, -1.2, 1.2, 3.6].map((x) => (
        <mesh key={x} position={[x, WALL_H - 0.12, 0]} rotation-y={0.35}>
          <boxGeometry args={[0.06, 0.04, ROOM * 2.2]} />
          <meshBasicMaterial color={MAT.light} />
        </mesh>
      ))}
    </group>
  );
}

// 이름표 — 캔버스에 그린 그림을 늘 카메라를 보는 판(sprite)으로. (drei Html 은 사람이 나갈 때 화면이 깨져서 쓰지 않음)
function NameTag({ text, mine }: { text: string; mine: boolean }) {
  const { material, width } = useMemo(() => {
    const scale = 2;
    const font = `600 ${24 * scale}px "Pretendard Variable", Pretendard, sans-serif`;
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 28 * scale;
    const h = 40 * scale;
    c.width = w;
    c.height = h;
    ctx.font = font;
    ctx.fillStyle = mine ? MAT.matBorder : "#FFFFFF";
    ctx.strokeStyle = MAT.wallTrim;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.roundRect(scale, scale, w - 2 * scale, h - 2 * scale, h / 2);
    ctx.fill();
    if (!mine) ctx.stroke();
    ctx.fillStyle = mine ? "#FFFFFF" : MAT.matBorder;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + scale);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { material: new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }), width: w / h };
  }, [text, mine]);
  return <sprite material={material} position={[0, 1.5, 0]} scale={[0.26 * width, 0.26, 1]} renderOrder={10} />;
}

const SKIN = new THREE.MeshLambertMaterial({ color: MAT.skin });
const GI = new THREE.MeshLambertMaterial({ color: MAT.gi });
const GI_SHADE = new THREE.MeshLambertMaterial({ color: MAT.giShade });
const HAIR = new THREE.MeshLambertMaterial({ color: MAT.hair });
const SHADOW = new THREE.MeshBasicMaterial({ color: MAT.shadow, transparent: true, opacity: 0.12 });

function Character({ player, mine, act }: { player: Player; mine: boolean; act: Act | null }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const actStart = useRef(0);
  const lastAct = useRef<Act | null>(null);
  const belt = useMemo(() => new THREE.MeshLambertMaterial({ color: beltColor(player.belt) }), [player.belt]);
  // 처음 나타날 때만 그 자리에 둔다. 그 뒤 목표가 바뀌면 아래 useFrame 이 걸어서 따라간다
  // (position 을 속성으로 주면 다시 그릴 때마다 목표로 순간이동한다)
  useLayoutEffect(() => {
    root.current?.position.set(player.x, 0, player.z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g || !body.current || !armR.current || !armL.current) return;
    const t = state.clock.elapsedTime;
    if (act !== lastAct.current) {
      lastAct.current = act;
      actStart.current = t;
    }
    // 걷기: 목표 자리로 부드럽게, 가는 쪽을 바라본다
    const dx = player.x - g.position.x;
    const dz = player.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    const walking = dist > 0.05;
    if (walking) {
      const step = Math.min(dist, dt * 2.2);
      g.position.x += (dx / dist) * step;
      g.position.z += (dz / dist) * step;
      const face = Math.atan2(dx, dz);
      g.rotation.y += (((face - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 10);
    }
    const bob = walking ? Math.abs(Math.sin(t * 10)) * 0.06 : Math.sin(t * 2) * 0.01;
    body.current.position.y = bob;
    // 동작
    const k = act ? Math.min(1, (t - actStart.current) / 1.4) : 1;
    const wave = act ? Math.sin(Math.PI * k) : 0;
    body.current.rotation.x = act === "oss" ? wave * 0.55 : 0; // 허리 숙여 인사
    armR.current.rotation.x = act === "highfive" ? -wave * 2.6 : act === "tap" ? -0.6 - Math.abs(Math.sin(t * 18)) * 0.5 * wave : walking ? Math.sin(t * 10) * 0.5 : 0;
    armL.current.rotation.x = act === "oss" ? wave * 0.4 : walking ? -Math.sin(t * 10) * 0.5 : 0;
    body.current.position.y += act === "tap" ? -wave * 0.12 : 0;
  });

  return (
    <group ref={root}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} material={SHADOW}>
        <circleGeometry args={[0.32, 20]} />
      </mesh>
      <group ref={body}>
        {/* 다리 */}
        <mesh position={[-0.1, 0.16, 0]} material={GI_SHADE}>
          <capsuleGeometry args={[0.08, 0.14, 4, 8]} />
        </mesh>
        <mesh position={[0.1, 0.16, 0]} material={GI_SHADE}>
          <capsuleGeometry args={[0.08, 0.14, 4, 8]} />
        </mesh>
        {/* 몸통(도복) + 띠 */}
        <mesh position-y={0.5} material={GI}>
          <capsuleGeometry args={[0.22, 0.26, 4, 12]} />
        </mesh>
        <mesh position-y={0.4} material={belt}>
          <cylinderGeometry args={[0.235, 0.235, 0.07, 16]} />
        </mesh>
        <mesh position={[0.08, 0.33, 0.2]} rotation-z={0.3} material={belt}>
          <boxGeometry args={[0.05, 0.16, 0.03]} />
        </mesh>
        {/* 팔(어깨에서 돈다) */}
        <group ref={armR} position={[0.27, 0.66, 0]}>
          <mesh position-y={-0.14} material={GI}>
            <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          </mesh>
          <mesh position-y={-0.3} material={SKIN}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
        </group>
        <group ref={armL} position={[-0.27, 0.66, 0]}>
          <mesh position-y={-0.14} material={GI}>
            <capsuleGeometry args={[0.065, 0.18, 4, 8]} />
          </mesh>
          <mesh position-y={-0.3} material={SKIN}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
        </group>
        {/* 머리 */}
        <mesh position-y={1.02} material={SKIN}>
          <sphereGeometry args={[0.27, 18, 14]} />
        </mesh>
        <mesh position={[0, 1.1, -0.03]} scale={[1.02, 0.8, 1.02]} material={HAIR}>
          <sphereGeometry args={[0.27, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <NameTag text={mine ? `나 · ${player.nickname}` : player.nickname} mine={mine} />
      </group>
    </group>
  );
}

export default function MatScene({
  players,
  myId,
  acts,
  onPick,
}: {
  players: Player[];
  myId: string | null;
  acts: ActEvent[];
  onPick: (x: number, z: number) => void;
}) {
  const actOf = (id: string) => acts.find((a) => a.player === id)?.act ?? null;
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 4, 10.5], fov: 60 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={[MAT.background]} />
      <hemisphereLight args={["#ffffff", MAT.mat, 1.6]} />
      <directionalLight position={[4, 8, 5]} intensity={1.3} />
      <Room onPick={onPick} />
      {players.map((p) => (
        <Character key={p.id} player={p} mine={p.id === myId} act={actOf(p.id)} />
      ))}
      <OrbitControls
        target={[0, 0.6, 0]}
        enablePan={false}
        minDistance={5}
        maxDistance={13}
        minPolarAngle={0.35}
        maxPolarAngle={1.4}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.1}
      />
    </Canvas>
  );
}
