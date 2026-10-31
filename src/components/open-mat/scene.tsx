import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeElements, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { MAT, beltColor } from "@/components/open-mat/colors";
import type { Act, ActEvent, Player, Stance } from "@/components/open-mat/use-mat";

// 오픈매트 3D(D-88, DESIGN '온라인 오픈매트') — 모델 파일 없이 기본 도형으로 그린 2등신 도복 캐릭터와 매트 방(3D 모델 캐릭터는 써 본 뒤 되돌림, 2026-10-31).
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

  // 벽 네 면 모두 같은 모양(흰 패드 + 옅은 회색 벽). 뒤 벽(처음 바라보는 쪽) 가운데에만 유리 출입문
  const walls = [
    { p: [0, 0, -ROOM] as const, r: 0, door: true },
    { p: [-ROOM, 0, 0] as const, r: Math.PI / 2, door: false },
    { p: [ROOM, 0, 0] as const, r: -Math.PI / 2, door: false },
    { p: [0, 0, ROOM] as const, r: Math.PI, door: false },
  ];
  const pads = Array.from({ length: Math.floor(ROOM) * 2 }, (_, i) => -Math.floor(ROOM) + 0.5 + i);

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
          {w.door ? (
            <>
              {/* 문 양옆 · 위 벽 */}
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * (DOOR_W / 2 + (ROOM - DOOR_W / 2) / 2), WALL_H / 2, 0]}>
                  <planeGeometry args={[ROOM - DOOR_W / 2, WALL_H]} />
                  <meshLambertMaterial color={MAT.wall} />
                </mesh>
              ))}
              <mesh position={[0, (WALL_H + DOOR_H) / 2, 0]}>
                <planeGeometry args={[DOOR_W, WALL_H - DOOR_H]} />
                <meshLambertMaterial color={MAT.wall} />
              </mesh>
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * (DOOR_W / 2 + (ROOM - DOOR_W / 2) / 2), PAD_H / 2, 0.01]}>
                  <planeGeometry args={[ROOM - DOOR_W / 2, PAD_H]} />
                  <meshLambertMaterial color={MAT.padGap} />
                </mesh>
              ))}
              <GlassDoor />
            </>
          ) : (
            <>
              {/* 위쪽 옅은 회색 벽 */}
              <mesh position-y={WALL_H / 2}>
                <planeGeometry args={[ROOM * 2, WALL_H]} />
                <meshLambertMaterial color={MAT.wall} />
              </mesh>
              {/* 패드 사이 틈 */}
              <mesh position={[0, PAD_H / 2, 0.01]}>
                <planeGeometry args={[ROOM * 2, PAD_H]} />
                <meshLambertMaterial color={MAT.padGap} />
              </mesh>
            </>
          )}
          {/* 흰 벽 패드 — 1m 폭, 틈이 보이게 조금 띄움(문 자리는 비움) */}
          {pads
            .filter((x) => !w.door || Math.abs(x) > DOOR_W / 2)
            .map((x) => (
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

// 유리 양문 출입문 — 어두운 알루미늄 틀 · 반투명 유리 · 세로 손잡이, 유리 너머로 밝은 복도
const DOOR_W = 2;
const DOOR_H = 2.4;
function GlassDoor() {
  const frame = { color: MAT.doorFrame };
  return (
    <group>
      {/* 복도(문 너머) — 벽 뒤쪽 */}
      <mesh position={[0, DOOR_H / 2, -1.2]}>
        <planeGeometry args={[DOOR_W + 1, DOOR_H + 0.4]} />
        <meshBasicMaterial color={MAT.hall} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, -0.6]}>
        <planeGeometry args={[DOOR_W + 1, 1.2]} />
        <meshLambertMaterial color={MAT.hallFloor} />
      </mesh>
      {/* 틀: 양옆 · 위 · 가운데 */}
      {[-DOOR_W / 2, 0, DOOR_W / 2].map((x) => (
        <mesh key={x} position={[x, DOOR_H / 2, 0.04]}>
          <boxGeometry args={[x === 0 ? 0.05 : 0.09, DOOR_H, 0.08]} />
          <meshLambertMaterial {...frame} />
        </mesh>
      ))}
      <mesh position={[0, DOOR_H + 0.04, 0.04]}>
        <boxGeometry args={[DOOR_W + 0.09, 0.09, 0.08]} />
        <meshLambertMaterial {...frame} />
      </mesh>
      <mesh position={[0, 0.05, 0.04]}>
        <boxGeometry args={[DOOR_W, 0.1, 0.06]} />
        <meshLambertMaterial {...frame} />
      </mesh>
      {/* 유리 두 장 */}
      {[-DOOR_W / 4, DOOR_W / 4].map((x) => (
        <mesh key={x} position={[x, DOOR_H / 2, 0.03]}>
          <planeGeometry args={[DOOR_W / 2 - 0.07, DOOR_H - 0.1]} />
          <meshLambertMaterial color={MAT.glass} transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ))}
      {/* 세로 손잡이 */}
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.11]}>
          <boxGeometry args={[0.03, 0.5, 0.03]} />
          <meshLambertMaterial color={MAT.handle} />
        </mesh>
      ))}
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
// 얼굴(본인 요청 2026-10-31) — 눈 · 코 · 웃는 입 · 볼터치. 머리(반지름 0.27, 가운데 y 1.02) 앞면(+z, 캐릭터가 보는 쪽)에 붙인다
const EYE = new THREE.MeshBasicMaterial({ color: MAT.eye });
const NOSE = new THREE.MeshLambertMaterial({ color: MAT.nose });
const MOUTH = new THREE.MeshBasicMaterial({ color: MAT.mouth });
const CHEEK = new THREE.MeshBasicMaterial({ color: MAT.cheek, transparent: true, opacity: 0.55, depthWrite: false });

function Face() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={`eye${side}`} position={[side * 0.09, 1.045, 0.247]} scale={[1, 1.25, 0.5]} material={EYE}>
          <sphereGeometry args={[0.03, 10, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.985, 0.266]} scale={[1, 0.8, 0.8]} material={NOSE}>
        <sphereGeometry args={[0.024, 10, 8]} />
      </mesh>
      {/* 웃는 입 — 도넛의 아래 반쪽 */}
      <mesh position={[0, 0.94, 0.252]} rotation={[-0.35, 0, Math.PI]} material={MOUTH}>
        <torusGeometry args={[0.045, 0.011, 6, 14, Math.PI]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`cheek${side}`} position={[side * 0.155, 0.975, 0.215]} rotation-y={side * 0.62} material={CHEEK}>
          <circleGeometry args={[0.034, 16]} />
        </mesh>
      ))}
    </group>
  );
}

// 내 캐릭터의 지금 자리 · 바라보는 방향 — 따라오는 카메라가 읽는다. 값은 메서드(copy · set)로만 바꾼다(React 규칙).
// 처음엔 y = -1 로 두고, 내 캐릭터가 한 번 그려지면 0 이 된다(= 준비됨).
type Pose = THREE.Object3D;

// 도복(본인 요청 2026-10-31 "몸이랑 구분되어 보이고 소매나 바짓단이 보이도록") — 흰 도복과 맨살(목 · 손목 · 발)이 갈라져 보이게,
// 깃(y자 옷깃) · 소매 끝 · 바짓단 · 상의 자락을 조금 진한 흰색 테두리로 두르고, 도복 조각에 먹색 외곽선(뒤집은 껍데기)을 얇게 준다.
const OUTLINE = new THREE.MeshBasicMaterial({ color: MAT.giLine, side: THREE.BackSide });
const HEM = new THREE.MeshLambertMaterial({ color: MAT.giHem });

// 도복 조각 하나 + 외곽선
function Gi({ children, material = GI, line = 1.07, ...props }: { children: React.ReactNode; material?: THREE.Material; line?: number } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh material={material}>{children}</mesh>
      <mesh material={OUTLINE} scale={line}>
        {children}
      </mesh>
    </group>
  );
}

// 앉기 자세(본인 요청 2026-10-31 "탑, 가드 넣어서 앉았다 일어났다") — 엉덩이 높이 · 몸 기울기 · 다리 · 팔 각도
// 다리는 허벅지(엉덩이에서 돎) + 정강이(무릎에서 돎) 두 마디
const STANCE_POSE: Record<Stance, { hip: number; lean: number; leg: number; knee: number; legSpread: number; arm: number }> = {
  stand: { hip: 0, lean: 0, leg: 0, knee: 0, legSpread: 0, arm: 0 },
  guard: { hip: -0.24, lean: -0.45, leg: -1.75, knee: 1.75, legSpread: 0.55, arm: -1.0 }, // 매트에 엉덩이를 대고 앉아 무릎을 세워 벌림(가드)
  top: { hip: -0.13, lean: 0.4, leg: 0, knee: 1.5, legSpread: 0.15, arm: -1.15 }, // 두 무릎을 꿇고 상체를 숙여 두 손을 앞으로(탑)
};

function Character({ player, mine, act, pose }: { player: Player; mine: boolean; act: Act | null; pose: Pose }) {
  const root = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const actStart = useRef(0);
  const lastAct = useRef<Act | null>(null);
  const cur = useRef({ ...STANCE_POSE.stand }); // 지금 자세 — 목표 자세로 부드럽게 앉았다 일어난다
  const belt = useMemo(() => new THREE.MeshLambertMaterial({ color: beltColor(player.belt) }), [player.belt]);
  // 처음 나타날 때만 그 자리에 둔다. 그 뒤 목표가 바뀌면 아래 useFrame 이 걸어서 따라간다
  // (position 을 속성으로 주면 다시 그릴 때마다 목표로 순간이동한다)
  useLayoutEffect(() => {
    root.current?.position.set(player.x, 0, player.z);
    if (root.current) root.current.rotation.y = Math.PI; // 처음엔 모두 뒤 벽(앞쪽)을 본다 — 카메라가 뒤에서 보게
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g || !hips.current || !body.current || !armR.current || !armL.current || !legR.current || !legL.current || !kneeR.current || !kneeL.current) return;
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
    if (mine) {
      pose.position.copy(g.position);
      pose.rotation.copy(g.rotation);
    }
    // 자세: 걷는 동안엔 서고, 아니면 고른 자세로 약 0.4초에 걸쳐 앉는다
    const goal = STANCE_POSE[walking ? "stand" : player.stance];
    const c = cur.current;
    const k = Math.min(1, dt * 7);
    for (const key of Object.keys(c) as (keyof typeof c)[]) c[key] += (goal[key] - c[key]) * k;
    const seated = Math.min(1, Math.abs(c.hip) / 0.16); // 앉은 정도(0 서 있음 ~ 1 앉음)

    const bob = walking ? Math.abs(Math.sin(t * 10)) * 0.06 : Math.sin(t * 2) * 0.01 * (1 - seated);
    hips.current.position.y = c.hip + bob;
    // 동작
    const a = act ? Math.min(1, (t - actStart.current) / 1.4) : 1;
    const wave = act ? Math.sin(Math.PI * a) : 0;
    body.current.rotation.x = c.lean + (act === "oss" ? wave * 0.55 : 0); // 허리 숙여 인사
    const swing = walking ? Math.sin(t * 10) * 0.5 : 0;
    armR.current.rotation.x =
      act === "fistbump" ? -wave * 1.55 : // 콤파치: 오른팔을 앞으로 쭉 내밀었다 거둔다
      act === "tap" ? -0.6 - Math.abs(Math.sin(t * 18)) * 0.5 * wave :
      c.arm + swing;
    armL.current.rotation.x = act === "oss" ? wave * 0.4 : c.arm - swing;
    legR.current.rotation.x = c.leg - swing * 0.8;
    legL.current.rotation.x = c.leg + swing * 0.8;
    legR.current.rotation.z = c.legSpread;
    legL.current.rotation.z = -c.legSpread;
    kneeR.current.rotation.x = c.knee + Math.max(0, swing) * 0.6;
    kneeL.current.rotation.x = c.knee + Math.max(0, -swing) * 0.6;
    body.current.position.y = act === "tap" ? -wave * 0.12 : 0;
  });

  return (
    <group ref={root}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} material={SHADOW}>
        <circleGeometry args={[0.32, 20]} />
      </mesh>
      <group ref={hips}>
        {/* 다리(엉덩이에서 돈다) — 도복 바지 · 바짓단 · 맨발 */}
        {([
          [legR, kneeR, 1],
          [legL, kneeL, -1],
        ] as const).map(([ref, knee, side]) => (
          <group key={side} ref={ref} position={[side * 0.1, 0.32, 0]}>
            <Gi position-y={-0.07} material={GI_SHADE}>
              <cylinderGeometry args={[0.09, 0.088, 0.15, 10]} />
            </Gi>
            <group ref={knee} position-y={-0.14}>
              <Gi position-y={-0.05} material={GI_SHADE}>
                <cylinderGeometry args={[0.088, 0.09, 0.11, 10]} />
              </Gi>
              <mesh position-y={-0.1} material={HEM}>
                <cylinderGeometry args={[0.097, 0.097, 0.035, 10]} />
              </mesh>
              <mesh position={[0, -0.145, 0.03]} scale={[1, 0.7, 1.4]} material={SKIN}>
                <sphereGeometry args={[0.06, 10, 8]} />
              </mesh>
            </group>
          </group>
        ))}
        <group ref={body}>
          {/* 상의(도복) + 아래 자락 + 띠 */}
          <Gi position-y={0.55} line={1.05}>
            <capsuleGeometry args={[0.22, 0.22, 4, 14]} />
          </Gi>
          <mesh position-y={0.36} material={HEM}>
            <cylinderGeometry args={[0.24, 0.255, 0.08, 16]} />
          </mesh>
          <mesh position-y={0.43} material={belt}>
            <cylinderGeometry args={[0.235, 0.235, 0.065, 16]} />
          </mesh>
          <mesh position={[0.08, 0.36, 0.22]} rotation-z={0.3} material={belt}>
            <boxGeometry args={[0.05, 0.15, 0.03]} />
          </mesh>
          {/* 옷깃 — 목 아래 맨살이 조금 보이고 깃이 가슴에서 겹친다 */}
          <mesh position={[0, 0.74, 0.17]} rotation-x={-0.25} material={SKIN}>
            <coneGeometry args={[0.07, 0.14, 3]} />
          </mesh>
          {/* 깃 선은 'y' 모양(본인이 보낸 그림, 2026-10-31): 목 아래 두 짧은 선이 가운데서 만나고, 한 줄이 왼쪽 아래(띠)까지 비스듬히 */}
          <mesh position={[-0.022, 0.725, 0.2]} rotation={[-0.3, 0, 0.46]} material={HEM}>
            <boxGeometry args={[0.04, 0.105, 0.03]} />
          </mesh>
          <mesh position={[0.026, 0.725, 0.2]} rotation={[-0.3, 0, -0.53]} material={HEM}>
            <boxGeometry args={[0.04, 0.11, 0.03]} />
          </mesh>
          <mesh position={[-0.047, 0.575, 0.21]} rotation={[0, 0, -0.42]} material={HEM}>
            <boxGeometry args={[0.04, 0.245, 0.03]} />
          </mesh>
          {/* 팔(어깨에서 돈다) — 소매 · 소매 끝 · 손 */}
          {([
            [armR, 1],
            [armL, -1],
          ] as const).map(([ref, side]) => (
            <group key={side} ref={ref} position={[side * 0.27, 0.7, 0]}>
              <Gi position-y={-0.12}>
                <cylinderGeometry args={[0.07, 0.08, 0.22, 10]} />
              </Gi>
              <mesh position-y={-0.235} material={HEM}>
                <cylinderGeometry args={[0.085, 0.085, 0.035, 10]} />
              </mesh>
              <mesh position-y={-0.3} material={SKIN}>
                <sphereGeometry args={[0.058, 10, 8]} />
              </mesh>
            </group>
          ))}
          {/* 머리 */}
          <mesh position-y={1.02} material={SKIN}>
            <sphereGeometry args={[0.27, 18, 14]} />
          </mesh>
          <mesh position={[0, 1.1, -0.03]} scale={[1.02, 0.8, 1.02]} material={HAIR}>
            <sphereGeometry args={[0.27, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <Face />
        </group>
      </group>
      <NameTag text={mine ? `나 · ${player.nickname}` : player.nickname} mine={mine} />
    </group>
  );
}

// 내 캐릭터 뒤에서 따라다니는 카메라(본인 요청 2026-10-31). 화면을 옆으로 끌면 캐릭터 둘레로 돌아간다(본인 요청 2026-10-31 "드래그 해서 카메라 돌릴수도"),
// 다시 걷기 시작하면 천천히 캐릭터 뒤로 돌아온다. 살짝 누르기(6px 미만)는 걷기로 둔다(Room 의 e.delta).
// 벽 패드에 가리지 않게 카메라 자리는 방 안쪽으로 묶는다. 휴대폰 세로 화면에서 옆 사람도 보이게 조금 뒤 · 위 · 넓게.
const BEHIND = 4.4;
const HEIGHT = 2.8;
const CAM_LIMIT = ROOM - 0.4;
function FollowCamera({ pose }: { pose: Pose }) {
  const look = useRef(new THREE.Vector3(0, 0.8, 0));
  const want = useMemo(() => new THREE.Vector3(), []);
  const aim = useMemo(() => new THREE.Vector3(), []);
  const yaw = useRef(0); // 끌어서 돌린 각도(캐릭터 뒤 기준)
  const last = useRef(new THREE.Vector3(0, -1, 0));
  const el = useThree((s) => s.gl.domElement);
  useEffect(() => {
    let id: number | null = null;
    let x = 0;
    const down = (e: PointerEvent) => {
      if (id !== null) return; // 손가락 하나만
      id = e.pointerId;
      x = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      yaw.current -= (e.clientX - x) * 0.008;
      x = e.clientX;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === id) id = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [el]);
  useFrame(({ camera }, dt) => {
    if (pose.position.y < 0) return;
    // 걷는 중이면 돌린 각도를 천천히 풀어 다시 뒤에서 본다
    if (last.current.distanceTo(pose.position) > dt * 0.5) yaw.current *= Math.exp(-dt * 1.5);
    last.current.copy(pose.position);
    const fx = Math.sin(pose.rotation.y + yaw.current);
    const fz = Math.cos(pose.rotation.y + yaw.current);
    const p = { pos: pose.position };
    want.set(
      Math.max(-CAM_LIMIT, Math.min(CAM_LIMIT, p.pos.x - fx * BEHIND)),
      HEIGHT,
      Math.max(-CAM_LIMIT, Math.min(CAM_LIMIT, p.pos.z - fz * BEHIND)),
    );
    aim.set(p.pos.x + fx * 1.5, 0.9, p.pos.z + fz * 1.5);
    const k = 1 - Math.exp(-dt * 4); // 부드럽게 따라가기
    camera.position.lerp(want, k);
    look.current.lerp(aim, k);
    camera.lookAt(look.current);
  });
  return null;
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
  const pose = useMemo<Pose>(() => {
    const o = new THREE.Object3D();
    o.position.set(0, -1, 0);
    return o;
  }, []);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, HEIGHT + 0.5, 5.5], fov: 68 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={[MAT.background]} />
      <hemisphereLight args={["#ffffff", MAT.mat, 1.6]} />
      <directionalLight position={[4, 8, 5]} intensity={1.3} />
      <Room onPick={onPick} />
      {players.map((p) => (
        <Character key={p.id} player={p} mine={p.id === myId} act={actOf(p.id)} pose={pose} />
      ))}
      <FollowCamera pose={pose} />
    </Canvas>
  );
}
