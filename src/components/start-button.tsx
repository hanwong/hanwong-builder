import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// T-12: 시작하기 → /app. 로그인 안 된 사용자를 /app/login 으로 보내는 건 T-03 에서 붙인다.
export function StartButton({ className }: { className?: string }) {
  return (
    <Button asChild className={"h-12 rounded-full px-6 text-base " + (className ?? "")}>
      <Link href="/app">
        시작하기
        <ArrowRight data-icon="inline-end" aria-hidden />
      </Link>
    </Button>
  );
}
