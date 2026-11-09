"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle, ModalBody, ModalContent } from "@/components/ui/dialog";
import { PositionPicture } from "@/components/app/position-picture";
import { YoutubeLink } from "@/components/app/youtube-link";
import { getTechniqueCard, type TechniqueCard } from "@/app/gym/actions";
import { AI_NOTICE } from "@/lib/ai-notice";

// 관장 화면 기술 팝업 (D-136) — 관원 기술 · 수업 기술을 누르면 기술 목록 탭으로 넘어가지 않고 이 자리에서 읽는다.
// 내 숙련도 · 내 정리는 보는 사람(관장) 것이라 넣지 않고, 기술 설명만. slug 가 null 이면 닫힘
export function TechniqueModal({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const open = slug !== null;
  const [card, setCard] = useState<{ slug: string; data: TechniqueCard | null } | null>(null);
  const loading = open && card?.slug !== slug;

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    getTechniqueCard(slug)
      .catch(() => null)
      .then((data) => alive && setCard({ slug, data }));
    return () => {
      alive = false;
    };
  }, [slug]);

  const t = !loading ? card?.data : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent open={open}>
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {t?.position && (
              <Badge variant="secondary" className="self-start">
                {t.position}
              </Badge>
            )}
            <DialogTitle className="text-[22px] font-bold tracking-tight">
              {t ? <span className="mark-lime">{t.nameKo}</span> : loading ? "불러오는 중" : "기술"}
            </DialogTitle>
            {t && (
              <p className="text-[13px] font-medium text-muted-foreground">
                {t.nameEn}
                {t.aliases.length > 0 && ` · 다른 이름: ${t.aliases.join(", ")}`}
              </p>
            )}
          </div>
          {t && <PositionPicture slug={t.positionSlug} size={72} className="rounded-2xl" />}
          <Button variant="ghost" size="icon" aria-label="닫기" className="-mr-1 -mt-1 shrink-0 rounded-full" onClick={onClose}>
            <X />
          </Button>
        </div>
        <DialogDescription className="sr-only">기술 설명 — 세팅 과정과 규정 · 안전</DialogDescription>

        <ModalBody className="gap-3.5">

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="불러오는 중" />
          </div>
        ) : !t ? (
          <p className="text-[15px] text-muted-foreground">기술 설명을 불러오지 못했어요. 닫고 다시 눌러 주세요.</p>
        ) : (
          <>
            {t.rules.length > 0 && (
              <section className="flex flex-col gap-1.5 rounded-2xl bg-muted/60 p-3">
                <h3 className="flex items-center gap-1.5 text-[15px] font-semibold">
                  <ShieldAlert className="size-4" strokeWidth={2} aria-hidden />
                  규정 · 안전
                </h3>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-[14px] leading-relaxed">
                  {t.rules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-semibold">세팅 과정</h3>
                <span className="text-[12px] font-medium text-muted-foreground">오른손잡이 기준</span>
              </div>
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
                {t.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="text-[12px] leading-relaxed text-muted-foreground">{AI_NOTICE}</p>
              <YoutubeLink nameEn={t.nameEn} />
            </section>
          </>
        )}
        </ModalBody>
      </ModalContent>
    </Dialog>
  );
}
