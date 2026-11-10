"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MemoField } from "@/components/app/memo-field";
import { BottomAction } from "@/components/app/bottom-action";
import { PositionPicture } from "@/components/app/position-picture";
import { TechniquePicker } from "@/components/app/technique-picker";
import { CustomTechniqueCard } from "@/components/app/custom-technique-card";
import { postClass, updateClass } from "@/app/gym/actions";
import type { MyGym } from "@/lib/gym-data";
import type { MatchedTechnique } from "@/lib/mock/log-seed";
import { formatKoreanDate } from "@/lib/seoul-date";

export type ClassFormInitial = {
  id: string | null; // 있으면 고치기
  scheduleId: string | null;
  heldOn: string;
  name: string;
  startsAt: string;
  body: string;
  techniques: { slug: string; nameKo: string; nameEn?: string; position?: string; positionSlug?: string | null }[];
  customNames: string[];
};

// 수업 내용 등록 · 고치기 (D-127, FLOW 8-3 · DESIGN '관장님 버전') — 기록 화면과 같은 뼈대: 기술 고르기(같은 팝업) → 기술 카드 → 메모 → 아래 고정 "등록"
export function ClassForm({ gym, initial, today = "", onCancel }: { gym: MyGym; initial: ClassFormInitial; today?: string; onCancel?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [startsAt, setStartsAt] = useState(initial.startsAt);
  const [body, setBody] = useState(initial.body);
  const [techniques, setTechniques] = useState<ClassFormInitial["techniques"]>(initial.techniques);
  const [customNames, setCustomNames] = useState<string[]>(initial.customNames);
  const [saving, start] = useTransition();
  const count = techniques.length + customNames.length;
  const canSave = name.trim().length > 0 && /^\d{2}:\d{2}$/.test(startsAt) && (count > 0 || body.trim().length > 0);

  function toggle(t: MatchedTechnique) {
    setTechniques((list) =>
      list.some((x) => x.slug === t.id)
        ? list.filter((x) => x.slug !== t.id)
        : [...list, { slug: t.id, nameKo: t.nameKo, nameEn: t.nameEn, position: t.position, positionSlug: t.positionSlug ?? null }],
    );
  }
  function addCustom(n: string) {
    const v = n.trim().slice(0, 60);
    if (!v) return;
    setCustomNames((l) => (l.includes(v) ? l : [...l, v]));
  }

  function save() {
    start(async () => {
      const input = { scheduleId: initial.scheduleId, heldOn: initial.heldOn, name, startsAt, body, slugs: techniques.map((t) => t.slug), customNames };
      if (initial.id) {
        const res = await updateClass(initial.id, input).catch(() => null);
        if (!res || !res.ok) {
          toast.error(res?.message ?? "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
          return;
        }
        toast.success("수업 내용을 고쳤어요");
        onCancel?.();
        router.refresh();
      } else {
        const res = await postClass(gym.id, input).catch(() => null);
        if (!res || !res.ok) {
          toast.error(res?.message ?? "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
          return;
        }
        toast.success(today && initial.heldOn > today ? "미리 등록했어요 — 수업 날 관원 홈에 카드가 떠요" : "수업 내용을 등록했어요 — 관원 홈에 카드가 떠요");
        router.replace(`/gym/class/${res.id}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="icon" aria-label="뒤로" className="-ml-2 rounded-full" onClick={() => (onCancel ? onCancel() : router.push("/gym"))}>
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Button>
        <span className="text-[13px] font-medium text-muted-foreground">
          {gym.name} · {formatKoreanDate(initial.heldOn)}
        </span>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 20))} aria-label="수업 이름" className="h-11 flex-1 rounded-xl text-[17px] font-semibold" />
          <Input type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} aria-label="시작 시각" className="h-11 w-32 rounded-xl text-base" />
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold">배운 기술</h2>
          {count > 0 && <span className="ml-auto text-[13px] font-medium text-muted-foreground tabular-nums">{count}개</span>}
        </div>
        {techniques.map((t) => (
          <Card key={t.slug} className="rounded-2xl ring-border">
            <CardContent className="flex items-start gap-3">
              <PositionPicture slug={t.positionSlug} size={56} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[17px] font-semibold">
                  <span className="mark-lime">{t.nameKo}</span>
                </span>
                {(t.nameEn || t.position) && (
                  <span className="text-[13px] font-medium text-muted-foreground">{[t.nameEn, t.position].filter(Boolean).join(" · ")}</span>
                )}
              </div>
              <Button variant="ghost" size="icon" aria-label={`${t.nameKo} 빼기`} className="-mr-2 -mt-1 rounded-full" onClick={() => setTechniques((l) => l.filter((x) => x.slug !== t.slug))}>
                <X className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {/* 목록에 없는 기술 — 기록 화면과 같은 카드: AI로 만들기 · 직접 만들기(D-148). 만들면 위 기술 카드로 바뀐다 */}
        {customNames.map((n) => (
          <CustomTechniqueCard
            key={n}
            name={n}
            disabled={saving}
            onRemove={() => setCustomNames((l) => l.filter((x) => x !== n))}
            onCreated={(t) => {
              setCustomNames((l) => l.filter((x) => x !== n));
              setTechniques((list) =>
                list.some((x) => x.slug === t.id)
                  ? list
                  : [...list, { slug: t.id, nameKo: t.nameKo, nameEn: t.nameEn, position: t.position, positionSlug: t.positionSlug ?? null }],
              );
            }}
          />
        ))}
        <TechniquePicker selected={techniques.map((t) => t.slug)} onToggle={toggle} onCustom={addCustom} />
      </section>

      <MemoField
        value={body}
        onChange={setBody}
        disabled={saving}
        title="메모"
        placeholder="오늘 포인트, 관원들에게 전할 말"
        ariaLabel="수업 메모"
        max={2000}
        footnote={<p className="text-[12px] text-muted-foreground">관원이 출석하면 기술과 메모가 그 사람 기록으로 복사돼요.</p>}
      />

      <BottomAction>
        <Button className="h-12 w-full rounded-full text-base" disabled={!canSave || saving} onClick={save}>
          {saving && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
          {initial.id ? "고친 내용 저장" : "등록"}
        </Button>
      </BottomAction>
    </div>
  );
}
