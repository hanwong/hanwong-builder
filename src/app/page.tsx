import { Anton } from "next/font/google";
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

// 빈티지 로고 톤(D-170 · D-171): 색 · 종이 결 · 배지 그림은 이 화면에만. 색은 globals.css 의 .vintage 가 토큰을 바꿔 끼운다
// 영어 장식 글자용 굵고 좁은 글꼴 — 로고의 Futura Condensed 자리
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });

// 랜딩 문구 — PLAN.md 와 같게(D-56 기술 먼저 고르기, D-58 복습 뺌). 서비스명 표기: 로고 Re:Re:Roll, 본문 리리롤 (D-16)

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

// 제목 위 영어 한 줄(장식) + 제목
function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {eyebrow && (
        <p aria-hidden className="vt-display text-sm text-vt-red md:text-base">
          ★ {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-extrabold tracking-tight md:text-4xl">{children}</h2>
    </div>
  );
}

// 구분선 — 줄 · 별 · 줄
function Divider() {
  return (
    <div aria-hidden className="mx-auto flex max-w-5xl items-center gap-3 px-6">
      <Separator className="flex-1" />
      <span className="text-sm text-vt-red">★</span>
      <Separator className="flex-1" />
    </div>
  );
}

// 띠 — 로고의 "ROLL · SWEAT · REPEAT"
function Band() {
  return (
    <div aria-hidden className="overflow-hidden bg-vt-ink text-vt-cream">
      <p className="vt-display flex justify-center gap-4 py-2.5 text-base whitespace-nowrap md:text-lg">
        {Array.from({ length: 4 }).flatMap((_, i) => [
          <span key={`r${i}`}>Roll</span>,
          <span key={`a${i}`} className="text-vt-mustard">★</span>,
          <span key={`s${i}`}>Sweat</span>,
          <span key={`b${i}`} className="text-vt-mustard">★</span>,
          <span key={`p${i}`}>Repeat</span>,
          <span key={`c${i}`} className="text-vt-mustard">★</span>,
        ])}
      </p>
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
              className="pos-pic shrink-0 rounded-xl"
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
            className="pos-pic shrink-0 rounded-lg"
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
    <main className={`vintage flex-1 ${display.variable}`}>
      {/* 맨 위 줄 — 서비스명 */}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 pt-6">
        <span className="text-lg font-extrabold tracking-tight">Re:Re:Roll</span>
        <span aria-hidden className="vt-display text-xs text-vt-navy md:text-sm">
          Jiu-Jitsu · Mat Club
        </span>
      </div>

      {/* 1. 히어로 */}
      <section className="mx-auto grid max-w-5xl items-center gap-8 px-6 pt-8 pb-16 md:grid-cols-[1.25fr_1fr] md:gap-12 md:py-24">
        {/* 로고 배지(D-170) — 장식 */}
        <div aria-hidden className="relative mx-auto w-56 md:order-last md:w-full md:max-w-sm">
          <Image src="/landing/badge-seal.png" alt="" width={750} height={735} sizes="(min-width: 768px) 384px, 224px" className="h-auto w-full" priority />
          <Image
            src="/landing/badge-tap.png"
            alt=""
            width={750}
            height={735}
            sizes="(min-width: 768px) 190px, 110px"
            className="absolute -right-6 -bottom-5 h-auto w-1/2 rotate-6 md:-right-4"
          />
        </div>
        <div className="reveal space-y-6">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
            오늘 배운 주짓수, 잊지 않게 해줄게요
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            기술 이름을 몰라도 돼요. 포지션 그림을 눌러 오늘 배운 기술을 고르면 Re:Re:Roll(리리롤)이
            이름과 세팅 과정을 붙여 주고, 내 기술 목록에 숙련도와 함께 쌓아 둬요. 수업 끝나고
            1분이면 돼요.
          </p>
          <StartButton />
        </div>
      </section>

      <Band />

      {/* 2. 문제 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-28">
        <div className="reveal mx-auto max-w-3xl space-y-6">
          <SectionTitle eyebrow="After class">수업 끝나고 집에 오면</SectionTitle>
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
                <CardDescription className="font-semibold text-vt-navy">불편 0{i + 1}</CardDescription>
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
          <SectionTitle eyebrow="How it works">이렇게 작동해요</SectionTitle>
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
        <div className="reveal flex items-end justify-between gap-6">
          <SectionTitle eyebrow="Keep rolling">이래서 쓰게 돼요</SectionTitle>
          <Image
            src="/landing/badge-repeat.png"
            alt=""
            aria-hidden
            width={750}
            height={735}
            sizes="(min-width: 768px) 176px, 112px"
            className="h-auto w-28 shrink-0 -rotate-3 md:w-44"
          />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="reveal rounded-2xl ring-border">
            <CardHeader>
              <CardDescription className="font-semibold text-vt-navy">처음 써 보면</CardDescription>
              <CardTitle className="text-lg font-semibold md:text-xl">
                오픈 가드 그림을 눌러 &quot;케이 가드&quot;를 골랐더니 발을 어디에 거는지부터 세팅
                과정 4줄이 따라와요
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="reveal rounded-2xl ring-border">
            <CardHeader>
              <CardDescription className="font-semibold text-vt-navy">계속 쓰게 되는 이유</CardDescription>
              <CardTitle className="text-lg font-semibold md:text-xl">
                수업마다 배운 기술을 고르면 내 기술 목록에 숙련도가 쌓이고, 수련 벨트에 한 주가
                채워져요
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* 5. 시작하기 — 남색 띠 */}
      <section className="bg-vt-navy text-vt-cream">
        <div className="reveal mx-auto max-w-3xl space-y-6 px-6 py-16 text-center md:py-24">
          <Image
            src="/landing/badge-pill.png"
            alt=""
            aria-hidden
            width={750}
            height={735}
            sizes="288px"
            className="mx-auto -my-12 h-auto w-64 md:w-72"
          />
          <h2 className="text-2xl font-extrabold tracking-tight md:text-4xl">다음 수업부터, 배운 게 남게</h2>
          <p className="text-base text-vt-cream/80 md:text-lg">
            배운 기술 이름이 다음 주면 사라졌던 적이 있다면, 오늘 배운 것부터 적어 보세요.
          </p>
          <div className="flex justify-center">
            <StartButton className="bg-accent text-accent-foreground hover:bg-accent/90" />
          </div>
        </div>
      </section>

      {/* 6. 푸터 */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl space-y-1 px-6 py-10 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Re:Re:Roll</span> © 2026
          </p>
          <p>
            <Link href="/privacy" className="underline-offset-4 hover:underline">
              개인정보처리방침
            </Link>
            {" · "}
            <Link href="/terms" className="underline-offset-4 hover:underline">
              서비스 약관
            </Link>
            {" · "}
            <Link href="/wiki" className="underline-offset-4 hover:underline">
              기술 위키
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
