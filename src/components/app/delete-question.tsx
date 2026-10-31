"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteQuestion } from "@/app/app/ask/actions";

// 질문 지우기 — 기록 지우기(D-26)와 같은 확인 방식. 지우면 기록 탭으로.
export function DeleteQuestion({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, startDeleting] = useTransition();

  return (
    <section className="flex flex-col items-start gap-2 border-t border-border pt-4">
      {!confirm ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 rounded-full text-destructive hover:text-destructive"
          onClick={() => setConfirm(true)}
        >
          <Trash2 data-icon="inline-start" aria-hidden />이 질문 지우기
        </Button>
      ) : (
        <>
          <p className="text-[15px] font-medium">이 질문을 지울까요? 되돌릴 수 없어요.</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-full border-destructive/40 text-destructive hover:text-destructive"
              disabled={deleting}
              onClick={() =>
                startDeleting(async () => {
                  const res = await deleteQuestion(id).catch(() => null);
                  if (!res?.ok) {
                    toast.error(res?.message ?? "지우지 못했어요. 다시 눌러 주세요.");
                    return;
                  }
                  toast.success("질문을 지웠어요");
                  router.replace("/app/logs");
                })
              }
            >
              {deleting && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
              {deleting ? "지우는 중…" : "지우기"}
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-full text-muted-foreground"
              disabled={deleting}
              onClick={() => setConfirm(false)}
            >
              취소
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
