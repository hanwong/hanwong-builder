import { StartButton } from "@/components/start-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const pains = [
  "날씨 앱은 날씨만 알려 줘요",
  "거리와 시간대는 감으로 더해서 골라요",
  "계절 바뀔 땐 날씨를 일일이 확인해야 하고, 틀리면 뛰는 내내 덥거나 추워요",
];

const steps = [
  { title: "10일 복장 예보 캘린더를 열어요", desc: "날씨 앱처럼, 앞으로 10일이 한 줄로 보여요." },
  { title: "뛸 날을 누르면 시간별 추천 의류가 실제 제품으로 보여요", desc: "기온 · 바람 · 해 뜨는 시간까지 반영해요." },
  { title: "내 러닝 스케줄에 저장해요", desc: "전날 밤엔 저장해 둔 것만 확인하면 돼요." },
];

const differences = [
  "날씨 앱은 날씨만 알려 주지만, Windner 는 그 날씨에 맞는 옷까지 실제 제품으로 보여 줘요",
  "옷장 앱은 옷 등록부터 시작하지만, 여기는 등록이 없어요",
  "한국 러너용이에요 — 기상청 예보 · 미세먼지 · 일출을 반영하고, 설치 없이 링크로 열려요",
];

// 예시 화면용 가짜 10일 (요일 · 최저/최고 · 내 러닝 날 표시)
const exampleDays = [
  { d: "화", lo: 9, hi: 18, run: true },
  { d: "수", lo: 8, hi: 17, run: false },
  { d: "목", lo: 6, hi: 15, run: true },
  { d: "금", lo: 5, hi: 14, run: false },
  { d: "토", lo: 4, hi: 13, run: true },
  { d: "일", lo: 3, hi: 12, run: false },
  { d: "월", lo: 2, hi: 11, run: false },
  { d: "화", lo: 2, hi: 10, run: true },
  { d: "수", lo: 1, hi: 9, run: false },
  { d: "목", lo: 0, hi: 8, run: true },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
      <span className="text-primary">&gt; </span>
      {children}
    </h2>
  );
}

function Divider() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <Separator className="overflow-hidden bg-transparent text-sm leading-none whitespace-nowrap text-muted-foreground/50 data-horizontal:h-auto before:content-['────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────']" />
    </div>
  );
}

function ExampleScreen() {
  return (
    <div className="reveal">
      <p className="mb-2 text-xs text-muted-foreground">예시 화면</p>
      <Card className="ring-border">
        <CardHeader>
          <CardDescription>Windner</CardDescription>
          <CardTitle className="text-lg font-semibold">앞으로 10일</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-10 gap-1 text-center text-xs">
            {exampleDays.map((day, i) => (
              <div
                key={i}
                className={
                  day.run
                    ? "space-y-1 bg-accent py-2 text-accent-foreground"
                    : "space-y-1 py-2 text-muted-foreground"
                }
              >
                <div className="font-semibold">{day.d}</div>
                <div>{day.hi}°</div>
                <div className="text-[10px]">{day.lo}°</div>
                <div className="text-[10px]">{day.run ? "런" : "·"}</div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">목 · 06:00</Badge>
            <Badge variant="outline">6° · 바람 약함</Badge>
            <Badge variant="outline">해 뜨기 전</Badge>
          </div>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-primary">+ </span>상의 · 얇은 긴팔 러닝 티
              <span className="ml-2 text-xs text-muted-foreground">[제품 사진]</span>
            </li>
            <li>
              <span className="text-primary">+ </span>하의 · 러닝 타이츠
              <span className="ml-2 text-xs text-muted-foreground">[제품 사진]</span>
            </li>
            <li>
              <span className="text-primary">+ </span>추가 · 가벼운 바람막이 · 장갑
              <span className="ml-2 text-xs text-muted-foreground">[제품 사진]</span>
            </li>
          </ul>
          <Separator />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>내 스케줄 · 화 · 목 · 토 06:00</span>
            <Badge variant="secondary">저장됨</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      {/* 1. 히어로 */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-32">
        <div className="reveal space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-primary">Windner</span>
            <Badge variant="outline">지금 검증 중인 아이디어예요</Badge>
          </div>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
            <span className="text-primary">&gt; </span>
            10일치 러닝 복장, 미리 정해 드려요
            <span className="terminal-cursor" aria-hidden />
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            정해진 요일에 뛰는 루틴 러너를 위해. 옷 등록 없이, 시간별 날씨에 맞는 러닝 의류를
            실제 제품으로 보여 드려요. 내 러닝 스케줄에 저장해 두면 전날 밤 고민이 끝나요.
          </p>
          <StartButton className="h-11 px-5 text-base" />
        </div>
      </section>

      <Divider />

      {/* 2. 문제 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-28">
        <div className="reveal mx-auto max-w-3xl space-y-6">
          <SectionTitle>전날 밤, 날씨 앱을 닫고 나서</SectionTitle>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            전날 밤, 날씨 앱을 열어 내일 아침 기온을 본다. 그런데 바람과 해 뜨는 시간까지
            더해서 뭘 입을지는 또 따로 고민이다. 결국 감으로 고르고, 계절이 바뀌는 달엔 꼭
            한 번은 너무 껴입거나 얇게 입고 나간다.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {pains.map((pain, i) => (
            <Card key={pain} className="reveal">
              <CardHeader>
                <CardDescription>불편 0{i + 1}</CardDescription>
                <CardTitle className="text-base font-semibold md:text-lg">{pain}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Divider />

      {/* 3. 작동 방식 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-28">
        <div className="reveal mx-auto max-w-3xl">
          <SectionTitle>이렇게 작동해요</SectionTitle>
        </div>
        <div className="mt-10 grid items-start gap-8 md:grid-cols-2">
          <div className="space-y-4">
            {steps.map((step, i) => (
              <Card key={step.title} className="reveal">
                <CardHeader>
                  <Badge className="mb-2">STEP {i + 1}</Badge>
                  <CardTitle className="text-base font-semibold md:text-lg">{step.title}</CardTitle>
                  <CardDescription>{step.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <ExampleScreen />
        </div>
      </section>

      <Divider />

      {/* 4. 이래서 쓰게 돼요 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-28">
        <div className="reveal mx-auto max-w-3xl">
          <SectionTitle>이래서 쓰게 돼요</SectionTitle>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card className="reveal">
            <CardHeader>
              <CardDescription>처음 써 보면</CardDescription>
              <CardTitle className="text-lg font-semibold md:text-xl">
                처음 연 날부터, 등록 없이 10일치 러닝 복장이 정해져 있어요
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="reveal">
            <CardHeader>
              <CardDescription>계속 쓰게 되는 이유</CardDescription>
              <CardTitle className="text-lg font-semibold md:text-xl">
                새 러닝 스케줄이 생길 때마다, 전날 밤 내일 것을 확인할 때마다 열어요
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Divider />

      {/* 5. 다른 점 */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-28">
        <div className="reveal space-y-8">
          <SectionTitle>뭐가 다르냐면</SectionTitle>
          <ul className="space-y-4">
            {differences.map((d) => (
              <li key={d} className="flex gap-3 text-base leading-relaxed md:text-lg">
                <span className="shrink-0 text-primary">$</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Divider />

      {/* 7. 시작하기 */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-28">
        <div className="reveal space-y-6 text-center">
          <SectionTitle>다음 러닝, 뭘 입을지 이미 정해져 있게</SectionTitle>
          <p className="text-base text-muted-foreground md:text-lg">
            뛰기 전날 밤 옷 고르기가 귀찮았던 적이 있다면, 열리면 가장 먼저 써 봐 주세요.
          </p>
          <StartButton className="h-11 px-5 text-base" />
        </div>
      </section>

      <Divider />

      {/* 8. 만든 사람 */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-28">
        <div className="reveal space-y-6">
          <SectionTitle>만든 사람</SectionTitle>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">김한웅</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-base leading-relaxed">
              <p>봄 · 가을 · 겨울마다 뛰기 전에 날씨를 확인하고 옷을 챙겨 두는 2년 차 러너예요.</p>
              <p className="text-muted-foreground">
                사진 보정 앱과 웹서비스 몇 가지를 직접 만들어 봤어요.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 9. 푸터 */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl space-y-1 px-6 py-10 text-sm text-muted-foreground">
          <p>
            <span className="text-primary">Windner</span> © 2026
          </p>
          <p>Built with Claude Code · AI 프로덕트 빌더 클럽 3기</p>
        </div>
      </footer>
    </main>
  );
}
