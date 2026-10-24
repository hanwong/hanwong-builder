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
  "배운 기술의 이름과 순서를 다음 주면 잊어요",
  "스파링에서 막힌 게 쌓이지 않아요",
  "일지 앱은 빈 칸만 주고, 결제 안 하면 해 볼 게 없어요",
];

const steps = [
  { title: "수업 끝나고 \"오늘 뭐 배웠어요?\" 에 아는 대로 말해요", desc: "이름을 몰라도, 순서가 틀려도 괜찮아요." },
  { title: "롤링스탯이 이름과 세팅 과정을 찾아 줘요", desc: "과정마다 기억남 · 까먹음을 체크하면 복습이 끝나요." },
  { title: "스파링에서 막힌 장면을 세 번 탭으로 남겨요", desc: "하려던 것 · 상대 · 결과. 스킬트리에 내 빈칸이 켜져요." },
];

const differences = [
  "일지 앱은 빈 칸을 주지만, 롤링스탯은 기술 지도와 세팅 과정을 처음부터 줘요",
  "이름을 몰라도 기록돼요. 기록하면 복습이 끝나요",
  "기록은 무제한 무료예요. 돈은 지도가 쌓인 뒤 정리 · 리포트에서만 받아요",
];

// 예시 화면용 스킬트리 한 토막 (하프가드)
const exampleSkills = [
  { name: "니슬라이스 패스", level: "먹힘", tone: "default" as const },
  { name: "언더훅 스윕", level: "드릴 됨", tone: "secondary" as const },
  { name: "딥 하프 진입", level: "배움", tone: "outline" as const },
  { name: "니슬라이스 방어", level: "카운터 필요", tone: "outline" as const },
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
          <CardDescription>롤링스탯 · 스킬트리</CardDescription>
          <CardTitle className="text-lg font-semibold">하프가드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {exampleSkills.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-primary">+ </span>
                  {s.name}
                </span>
                <Badge variant={s.tone}>{s.level}</Badge>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">오늘 수업 · 데라히바 가드 세팅</p>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="text-primary">✓ </span>① 상대 다리 바깥으로 내 다리 감기
              </li>
              <li>
                <span className="text-primary">✓ </span>② 같은 쪽 발목 잡기
              </li>
              <li>
                <span className="text-muted-foreground">? </span>③ 반대 발은 허벅지에
                <span className="ml-2 text-xs text-muted-foreground">까먹음</span>
              </li>
              <li>
                <span className="text-primary">✓ </span>④ 반대 소매 컨트롤
              </li>
            </ul>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">스파링 회고 · 1장면</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">하려던 것 · 니슬라이스 패스</Badge>
              <Badge variant="outline">상대 · 딥 하프</Badge>
              <Badge variant="secondary">막힘</Badge>
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
            <span className="font-semibold text-primary">롤링스탯</span>
            <Badge variant="outline">지금 검증 중인 아이디어예요</Badge>
          </div>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
            <span className="text-primary">&gt; </span>
            오늘 배운 주짓수, 말하면 스킬트리에 쌓여요
            <span className="terminal-cursor" aria-hidden />
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            기술 이름을 몰라도 돼요. 수업에서 배운 걸 말하면 롤링스탯이 이름과 세팅 과정을 찾아
            스킬트리에 꽂아 줘요. 스파링에서 막힌 것도 모아서, 내가 어디가 비었는지 보여 줘요.
          </p>
          <StartButton className="h-11 px-5 text-base" />
        </div>
      </section>

      <Divider />

      {/* 2. 문제 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-28">
        <div className="reveal mx-auto max-w-3xl space-y-6">
          <SectionTitle>수업 끝나고 집에 오면</SectionTitle>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            수업에서 데라히바 가드를 배웠다. 집에 오니 이름은 기억나는데 발을 어디에 거는지부터
            가물가물하다. 스파링에선 늘 같은 데서 패스를 당하는데 뭐가 문제인지 모아 볼 데가
            없고, 스토리에 적어 둔 건 하루 지나면 사라진다.
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
                &quot;상대 다리에 내 다리 감고 발목 잡는 거&quot; 라고 말했더니 데라히바 가드가 뜨고,
                세팅 과정 4줄이 따라와요
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="reveal">
            <CardHeader>
              <CardDescription>계속 쓰게 되는 이유</CardDescription>
              <CardTitle className="text-lg font-semibold md:text-xl">
                수업마다 배운 걸 꽂고 막힌 걸 적어요. 진급 전엔 내 지도를 봐요
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

      {/* 6. 가격 */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-28">
        <div className="reveal space-y-6">
          <SectionTitle>가격</SectionTitle>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">기록은 무제한 무료</CardTitle>
              <CardDescription>
                수업 정리와 스파링 회고는 몇 번을 쌓아도 돈을 받지 않아요. 지도가 쌓인 뒤의 정리 ·
                리포트 가격은 준비 중이에요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Divider />

      {/* 7. 시작하기 */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-28">
        <div className="reveal space-y-6 text-center">
          <SectionTitle>다음 수업부터, 배운 게 남게</SectionTitle>
          <p className="text-base text-muted-foreground md:text-lg">
            배운 기술 이름이 다음 주면 사라졌던 적이 있다면, 열리면 가장 먼저 써 봐 주세요.
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
              <p>쉬는 날 없이 매주 매트에 오르는 주짓수 수련자예요. 러닝도 2년째예요.</p>
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
            <span className="text-primary">롤링스탯</span> © 2026
          </p>
          <p>Built with Claude Code · AI 프로덕트 빌더 클럽 3기</p>
        </div>
      </footer>
    </main>
  );
}
