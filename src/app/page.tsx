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
  "러닝복이 많아서 뭐가 있는지 정리가 안 돼요",
  "날씨 앱은 기온만 알려 줘서, 거리와 시간대는 감으로 골라요",
  "잘못 입으면 뛰는 내내 덥거나 추워요",
];

const steps = [
  { title: "내 러닝복을 등록해요", desc: "가지고 있는 러닝복을 한 번만 넣어 두면 돼요." },
  { title: "내일 뛸 거리와 시간대를 알려 줘요", desc: "몇 km를, 해가 떠 있을 때 뛰는지 아닌지." },
  { title: "날씨까지 반영한 내 옷 조합을 받아요", desc: "내 옷장에 있는 옷 중에서 골라 드려요." },
];

const differences = [
  "날씨 앱은 기온만 알려 주지만, 내일런복은 내 옷장을 알고 있어요",
  "GPT 에는 매번 내 옷을 다시 설명해야 하지만, 여기는 한 번 등록하면 끝이에요",
  "거리와 해가 떠 있는지까지 반영해서 골라요",
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
          <CardDescription>내일런복</CardDescription>
          <CardTitle className="text-lg font-semibold">내일 입고 뛸 옷</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">내일 아침</Badge>
            <Badge variant="outline">해 뜨기 전</Badge>
            <Badge variant="outline">10km</Badge>
          </div>
          <Separator />
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-primary">+ </span>상의 · 얇은 긴팔 러닝 티
            </li>
            <li>
              <span className="text-primary">+ </span>하의 · 러닝 타이츠
            </li>
            <li>
              <span className="text-primary">+ </span>추가 · 가벼운 바람막이
            </li>
          </ul>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">내 옷장 · 겨울</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">긴팔 3</Badge>
              <Badge variant="secondary">타이츠 2</Badge>
              <Badge variant="secondary">장갑 없음</Badge>
            </div>
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
            <span className="font-semibold text-primary">내일런복</span>
            <Badge variant="outline">지금 검증 중인 아이디어예요</Badge>
          </div>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
            <span className="text-primary">&gt; </span>
            내 옷장에서, 내일 입고 뛸 옷을 골라 드려요
            <span className="terminal-cursor" aria-hidden />
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            러닝복은 많은데 매번 뭘 입을지 고민되는 러너를 위해. 등록해 둔 내 러닝복 중에서
            날씨 · 거리 · 시간대에 맞는 조합을 전날 밤 챙겨 드려요.
          </p>
          <StartButton className="h-11 px-5 text-base" />
        </div>
      </section>

      <Divider />

      {/* 2. 문제 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-28">
        <div className="reveal mx-auto max-w-3xl space-y-6">
          <SectionTitle>전날 밤, 문 앞에서</SectionTitle>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            전날 밤, 날씨 앱을 보고 내일 입을 러닝복을 대충 골라 문 앞에 둔다. 그런데 막상
            뛰다 보면 너무 껴입어서 덥거나, 해가 지고 나니 쌀쌀하다. 서랍엔 러닝복이 가득한데
            뭐가 있는지도 잘 기억나지 않는다.
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
                등록만 해도 계절별로 뭐가 부족하고 뭐가 남는지 옷장이 한눈에 보여요
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="reveal">
            <CardHeader>
              <CardDescription>계속 쓰게 되는 이유</CardDescription>
              <CardTitle className="text-lg font-semibold md:text-xl">
                뛰기 전날 밤, 내일 입을 옷을 챙길 때마다 열어요
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
          <SectionTitle>내일 아침, 고민 없이 나가기</SectionTitle>
          <p className="text-base text-muted-foreground md:text-lg">
            러닝복 고르기가 귀찮았던 적이 있다면, 열리면 가장 먼저 써 봐 주세요.
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
              <p>
                2년째 일주일에 2~3번 달리는 러너. 계절마다 러닝복이 3~4벌씩 쌓여 이 고민을
                매번 직접 겪어요.
              </p>
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
            <span className="text-primary">내일런복</span> © 2026
          </p>
          <p>Built with Claude Code · AI 프로덕트 빌더 클럽 3기</p>
        </div>
      </footer>
    </main>
  );
}
