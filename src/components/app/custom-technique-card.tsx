"use client";

import { useState, useTransition } from "react";
import { Loader2, PencilLine, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createOwnTechnique, generateTechnique, techniquePositions, type GenerateResult } from "@/app/app/log/actions";
import { forgetPicker } from "@/lib/picker-store";
import type { MatchedTechnique } from "@/lib/mock/log-seed";

// 목록에 없는 기술 카드 (D-57, 2026-10-31 본인 요청) — 기록 화면 · 수업 등록 화면(D-148)이 같이 쓴다.
// 이름 · 빼기 / '기술 카드 생성' — AI로 만들기 · 직접 만들기. 만든 카드는 만든 사람의 '승인 대기' 내 기술이 되고,
// 관리자가 승인하면 모두의 목록에 들어간다. AI 가 못 만들면 직접 적는 칸을 연다.
export function CustomTechniqueCard({
  name,
  disabled,
  onRemove,
  onCreated,
}: {
  name: string;
  disabled: boolean;
  onRemove: () => void;
  onCreated: (t: MatchedTechnique) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<{ slug: string; nameKo: string }[] | null>(null);

  function created(res: Extract<GenerateResult, { ok: true }>) {
    const t = res.technique;
    if (res.kind === "new") forgetPicker(); // 새 내 기술 — 다음 고르기 · 검색에 보이게 새로 받는다
    const left = res.left >= 0 ? ` · 오늘 ${res.left}번 남음` : "";
    toast.success(
      res.kind === "new"
        ? `‘${t.nameKo}’ 카드를 만들었어요. 관리자 승인 전까지 나에게만 보여요${left}`
        : `이미 목록에 있는 ‘${t.nameKo}’(으)로 바꿨어요${left}`,
    );
    onCreated(t);
  }
  async function generate() {
    setBusy(true);
    const res = await generateTechnique(name).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      toast.error(res?.message ?? "만들지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      const positions = res && !res.ok ? res.positions : undefined;
      if (positions?.length) setManual(positions);
      return;
    }
    created(res);
  }
  async function writeOwn() {
    if (manual) return;
    setBusy(true);
    const positions = await techniquePositions().catch(() => []);
    setBusy(false);
    if (!positions.length) {
      toast.error("포지션 목록을 받지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      return;
    }
    setManual(positions);
  }

  return (
    <Card className="rounded-2xl ring-border" size="sm">
      <CardContent className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{name}</span>
        <Button variant="ghost" size="icon-sm" aria-label={`${name} 빼기`} className="rounded-full text-muted-foreground" onClick={onRemove}>
          <X />
        </Button>
        <p className="w-full text-[13px] font-semibold text-muted-foreground">기술 카드 생성</p>
        <div className="flex w-full flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-full shadow-none" disabled={busy || disabled} onClick={generate}>
            {busy ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden /> : <Sparkles data-icon="inline-start" aria-hidden />}
            {busy ? "만드는 중…" : "AI로 만들기"}
          </Button>
          {!manual && (
            <Button variant="outline" size="sm" className="h-8 rounded-full shadow-none" disabled={busy || disabled} onClick={writeOwn}>
              <PencilLine data-icon="inline-start" aria-hidden />
              직접 만들기
            </Button>
          )}
        </div>
        {manual && <ManualTechniqueForm name={name} positions={manual} disabled={disabled} onCreated={created} />}
      </CardContent>
    </Card>
  );
}

// 직접 적어 기술 카드 만들기(2026-10-31 본인 요청) — AI 가 만들지 못했을 때, 관리자 초안 화면처럼 포지션을 고르고 내용을 적는다.
// AI 를 부르지 않는다. 만든 카드는 AI 로 만든 것과 같이 '승인 대기' 내 기술이 되고, 관리자가 고쳐 승인하면 모두의 목록에 들어간다.
function ManualTechniqueForm({
  name,
  positions,
  disabled,
  onCreated,
}: {
  name: string;
  positions: { slug: string; nameKo: string }[];
  disabled: boolean;
  onCreated: (res: Extract<GenerateResult, { ok: true }>) => void;
}) {
  const [position, setPosition] = useState("");
  const [nameKo, setNameKo] = useState(name.slice(0, 60));
  const [steps, setSteps] = useState("");
  const [busy, start] = useTransition();
  const id = (k: string) => `manual-${name}-${k}`;
  const lines = steps.split("\n").filter((l) => l.trim());
  const ready = position !== "" && nameKo.trim() !== "" && lines.length > 0;

  const submit = () =>
    start(async () => {
      const res = await createOwnTechnique(name, { position, nameKo, steps: lines }).catch(() => null);
      if (!res || !res.ok) {
        toast.error(res?.message ?? "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
        return;
      }
      onCreated(res);
    });

  return (
    <div className="mt-2 flex w-full flex-col gap-3 border-t border-border pt-3">
      <p className="text-[13px] font-medium text-muted-foreground">직접 적어서 만들기 — 관리자가 확인 후 모두의 기술 카드가 돼요.</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("position")}>포지션</Label>
        <NativeSelect id={id("position")} className="w-full" value={position} onChange={(e) => setPosition(e.target.value)}>
          <NativeSelectOption value="">고르기</NativeSelectOption>
          {positions.map((p) => (
            <NativeSelectOption key={p.slug} value={p.slug}>
              {p.nameKo}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("name")}>기술 이름</Label>
        <Input id={id("name")} value={nameKo} maxLength={60} onChange={(e) => setNameKo(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("steps")}>세팅 과정 (한 줄에 하나, 1~5줄)</Label>
        <Textarea
          id={id("steps")}
          value={steps}
          rows={4}
          placeholder={"예: 상대 오른쪽 깃을 왼손으로 깊게 잡는다\n오른손으로 상대 왼팔을 누른다"}
          onChange={(e) => setSteps(e.target.value.split("\n").slice(0, 5).join("\n"))}
        />
      </div>
      <Button className="rounded-full" disabled={!ready || busy || disabled} onClick={submit}>
        {busy && <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />}
        기술 카드 만들기
      </Button>
    </div>
  );
}

