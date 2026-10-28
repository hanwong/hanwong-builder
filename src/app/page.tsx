import Image from "next/image";
import Link from "next/link";
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
import { ListChecks, Map, Shapes } from "lucide-react";

// 랜딩 문구 — PLAN.md 와 같게(D-56 기술 먼저 고르기, D-58 복습 뺌). 서비스명 표기: 로고 Re:Re:롤, 본문 리리롤 (D-16)

const pains = [
  "배운 기술의 이름과 세팅 순서를 다음 주면 잊어요",
  "기술 이름을 몰라서 일지에 뭐라고 적을지 막막해요",
  "일지 앱은 빈 칸만 주고, 체험이 끝나면 기록에도 제한이 걸려요",
];

const steps = [
  {
    Icon: Shapes,
    title: "수업 끝나고 포지션 그림을 눌러 오늘 배운 기술을 골라요",
    desc: "이름을 몰라도 그림으로 찾아요. 목록에 없으면 이름만 적어도 기록돼요.",
  },
  {
    Icon: ListChecks,
    title: "기술마다 이름 · 포지션 · 세팅 과정이 따라와요",
    desc: "내 숙련도만 골라 두고, 느낀 점은 메모 한 칸에. 마이크로 말해도 돼요.",
  },
  {
    Icon: Map,
    title: "내 기술 목록에 숙련도와 함께 쌓여요",
    desc: "포지션별로 배운 기술이 한눈에. 오늘 기록은 이미지로 만들어 공유할 수 있어요.",
  },
];

const differences = [
  "일지 앱은 빈 칸을 주지만, 리리롤은 기술 이름과 세팅 과정을 채워 줘요",
  "이름을 몰라도 포지션 그림으로 골라요. 목록에 없는 기술은 이름만 적어도 기록돼요",
  "기록은 무제한 무료예요. 돈은 기록이 쌓인 뒤의 정리 · 리포트에서만 받아요",
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold tracking-tight md:text-4xl">{children}</h2>;
}

function Divider() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <Separator />
    </div>
  );
}

// 예시 화면: 오늘 배운 것 — 고른 기술(포지션 그림 · 세팅 과정 · 숙련도) + 메모 (D-56 흐름)
function ExampleScreen() {
  return (
    <div className="reveal space-y-3">
      <p className="text-[13px] font-medium text-muted-foreground">예시 화면 · 오늘 배운 것</p>
      <span className="block text-[15px] font-semibold">배운 기술</span>
      <Card className="rounded-2xl ring-border" size="sm">
        <CardContent className="space-y-2">
          <div className="flex items-start gap-3">
            <Image
              src="/positions/de-la-riva.png"
              alt=""
              width={56}
              height={56}
              className="shrink-0 rounded-xl bg-[#FAF9F4] ring-1 ring-border"
            />
            <div className="min-w-0">
              <span className="block text-[17px] font-semibold">
                <span className="mark-lime">데라히바 가드</span>
              </span>
              <span className="text-[13px] font-medium text-muted-foreground">De La Riva Guard · 오픈 가드</span>
            </div>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-muted-foreground">
            <li>상대 한쪽 다리 바깥으로 내 다리를 감아 발을 골반 앞에 건다</li>
            <li>같은 쪽 손으로 발목을 잡는다</li>
            <li>반대 발은 상대 허벅지나 골반에 댄다</li>
            <li>반대 손으로 소매나 깃을 잡아 상체를 컨트롤한다</li>
          </ol>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge className="bg-accent text-accent-foreground">비기너</Badge>
            <Badge variant="outline">초보</Badge>
            <Badge variant="outline">중급</Badge>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl ring-border" size="sm">
        <CardContent className="flex items-center gap-3">
          <Image
            src="/positions/passing.png"
            alt=""
            width={40}
            height={40}
            className="shrink-0 rounded-lg bg-[#FAF9F4] ring-1 ring-border"
          />
          <span className="min-w-0 flex-1 text-[15px]">
            <span className="mark-lime">니슬라이스 패스</span>
            <span className="ml-2 text-[13px] text-muted-foreground">패스</span>
          </span>
          <Badge variant="outline">초보</Badge>
        </CardContent>
      </Card>
      <span className="block pt-1 text-[15px] font-semibold">오늘 메모</span>
      <Card className="rounded-2xl ring-border" size="sm">
        <CardContent className="text-[15px] leading-relaxed">
          발목 그립을 놓치면 바로 무너짐. 스파링에서는 니슬라이스에 계속 패스 당함.
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
            <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" priority />
            <span className="text-lg font-bold tracking-tight">Re:Re:롤</span>
            <Badge variant="outline">지금 검증 중인 아이디어예요</Badge>
          </div>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
            오늘 배운 주짓수, 잊지 않게 해줄게요
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            기술 이름을 몰라도 돼요. 포지션 그림을 눌러 오늘 배운 기술을 고르면 Re:Re:롤(리리롤)이
            이름과 세팅 과정을 붙여 주고, 내 기술 목록에 숙련도와 함께 쌓아 둬요. 화이트 벨트부터
            블루 초반까지, 수업 끝나고 1분이면 돼요.
          </p>
          <StartButton />
        </div>
      </section>

      <Divider />

      {/* 2. 문제 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-28">
        <div className="reveal mx-auto max-w-3xl space-y-6">
          <SectionTitle>수업 끝나고 집에 오면</SectionTitle>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            수업에서 데라히바 가드를 배웠다. 집에 오니 이름은 기억나는데 발을 어디에 거는지부터
            가물가물하다. 일지에 적으려니 기술 이름을 모르고, 스토리에 적어 둔 건 하루 지나면
            사라진다. 다음 주 같은 수업에서 또 처음부터.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {pains.map((pain, i) => (
            <Card key={pain} className="reveal rounded-2xl ring-border">
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
            {steps.map(({ Icon, title, desc }, i) => (
              <Card key={title} className="reveal rounded-2xl ring-border">
                <CardHeader>
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    <Badge className="bg-accent text-accent-foreground">{i + 1}단계</Badge>
                  </div>
                  <CardTitle className="text-base font-semibold md:text-lg">{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
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
          <Card className="reveal rounded-2xl ring-border">
            <CardHeader>
              <CardDescription>처음 써 보면</CardDescription>
              <CardTitle className="text-lg font-semibold md:text-xl">
                오픈 가드 그림을 눌러 &quot;데라히바 가드&quot;를 골랐더니 발을 어디에 거는지부터 세팅
                과정 4줄이 따라와요
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="reveal rounded-2xl ring-border">
            <CardHeader>
              <CardDescription>계속 쓰게 되는 이유</CardDescription>
              <CardTitle className="text-lg font-semibold md:text-xl">
                수업마다 배운 기술을 고르면 내 기술 목록에 숙련도가 쌓이고, 수련 벨트에 한 주가
                채워져요
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
                <ListChecks className="mt-1 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
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
          <Card className="rounded-2xl ring-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">기록은 무제한 무료</CardTitle>
              <CardDescription>
                오늘 배운 것 기록은 몇 번을 쌓아도 돈을 받지 않아요. 기록이 쌓인 뒤의
                정리 · 리포트 가격은 준비 중이에요.
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
            배운 기술 이름이 다음 주면 사라졌던 적이 있다면, 오늘 배운 것부터 적어 보세요.
          </p>
          <div className="flex justify-center">
            <StartButton />
          </div>
        </div>
      </section>

      <Divider />

      {/* 8. 만든 사람 */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-28">
        <div className="reveal space-y-6">
          <SectionTitle>만든 사람</SectionTitle>
          <Card className="rounded-2xl ring-border">
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
            <span className="font-semibold text-foreground">Re:Re:롤</span> © 2026
          </p>
          <p>Built with Claude Code · AI 프로덕트 빌더 클럽 3기</p>
          <p>
            <Link href="/privacy" className="underline-offset-4 hover:underline">
              개인정보처리방침
            </Link>
            {" · "}
            <Link href="/terms" className="underline-offset-4 hover:underline">
              서비스 약관
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
