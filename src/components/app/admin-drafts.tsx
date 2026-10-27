"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { approveDraft, generateDrafts, rejectDraft } from "@/app/app/admin/actions";
import { searchTechniques } from "@/app/app/log/actions";
import type { AdminData, AdminDraft } from "@/lib/admin/admin-data";
import type { DraftKind } from "@/lib/admin/drafter";

const KIND_LABEL: Record<DraftKind, string> = {
  new: "새 기술",
  alias: "있는 기술의 다른 이름",
  unclear: "기술 아님 같음",
};

// 운영 화면 (D-47, FLOW /app/admin). 열면 초안 없는 새 이름을 AI 가 바로 초안으로 만들고(하루 20개),
// 운영자는 카드마다 고쳐서 승인 · 버림.
export function AdminDrafts({ data }: { data: AdminData }) {
  const router = useRouter();
  const [generating, startGenerate] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);
  const started = useRef(false);
  const auto = data.live && data.waiting > 0 && data.leftToday > 0;

  useEffect(() => {
    if (!auto || started.current) return;
    started.current = true;
    startGenerate(async () => {
      const r = await generateDrafts();
      if (!r.ok) setProblem(r.message);
      router.refresh();
    });
  }, [auto, router]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold tracking-tight">목록 추가 대기</h1>
        <p className="text-[14px] text-muted-foreground">
          기록에 직접 적힌 이름 → AI 초안 → 확인하고 승인하면 그 이름으로 적은 기록이 기술 카드가 돼요.
        </p>
      </header>

      {generating ? (
        <p className="flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />새 이름 {Math.min(data.waiting, data.leftToday)}개 초안
          만드는 중…
        </p>
      ) : problem ? (
        <p role="alert" className="text-[14px] font-medium text-destructive">
          {problem}
        </p>
      ) : data.waiting > 0 && !data.live ? (
        <p className="text-[14px] text-muted-foreground">초안 전 이름 {data.waiting}개 — Claude 키가 없어 초안을 못 만들어요.</p>
      ) : data.waiting > 0 && data.leftToday === 0 ? (
        <p className="text-[14px] text-muted-foreground">
          초안 전 이름 {data.waiting}개 — 오늘 만들 수 있는 초안을 다 써서 내일 열면 만들어요.
        </p>
      ) : null}

      {data.drafts.length === 0 && !generating && (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[15px] text-muted-foreground">
          대기 중인 이름이 없어요.
        </p>
      )}

      {data.drafts.map((d) => (
        <DraftCard key={d.id} draft={d} positions={data.positions} />
      ))}
    </div>
  );
}

function DraftCard({ draft, positions }: { draft: AdminDraft; positions: AdminData["positions"] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [kind, setKind] = useState<DraftKind>(draft.kind);
  const [aliasOf, setAliasOf] = useState(draft.aliasOf);
  const [position, setPosition] = useState(draft.position ?? "");
  const [slug, setSlug] = useState(draft.slug);
  const [nameKo, setNameKo] = useState(draft.nameKo);
  const [nameEn, setNameEn] = useState(draft.nameEn);
  const [aliases, setAliases] = useState(draft.aliases.join(", "));
  const [steps, setSteps] = useState(draft.steps.join("\n"));
  const id = (k: string) => `${draft.id}-${k}`;

  function act(fn: () => Promise<{ ok: boolean; message?: string }>) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message ?? "처리했어요.");
        router.refresh();
      } else toast.error(r.message ?? "처리하지 못했어요.");
    });
  }

  const approve = () =>
    act(() =>
      approveDraft(draft.id, {
        kind,
        aliasOf: aliasOf?.slug ?? null,
        position: position || null,
        slug,
        nameKo,
        nameEn,
        aliases: aliases.split(/[,，]/),
        steps: steps.split("\n"),
      }),
    );

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4" aria-labelledby={id("title")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <h2 id={id("title")} className="text-[17px] font-semibold">
          ‘{draft.name}’
        </h2>
        <span className="text-[13px] text-muted-foreground">
          {draft.times}번 · {draft.people}명
        </span>
      </div>
      {draft.note && <p className="text-[13px] text-muted-foreground">AI: {draft.note}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("kind")}>종류</Label>
        <NativeSelect
          id={id("kind")}
          className="w-full"
          value={kind}
          onChange={(e) => setKind(e.target.value as DraftKind)}
        >
          {(Object.keys(KIND_LABEL) as DraftKind[]).map((k) => (
            <NativeSelectOption key={k} value={k}>
              {KIND_LABEL[k]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {kind === "alias" && <AliasPicker value={aliasOf} onChange={setAliasOf} inputId={id("alias")} />}

      {kind === "new" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("position")}>포지션</Label>
            <NativeSelect
              id={id("position")}
              className="w-full"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <NativeSelectOption value="">고르기</NativeSelectOption>
              {positions.map((p) => (
                <NativeSelectOption key={p.slug} value={p.slug}>
                  {p.nameKo}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <Field id={id("ko")} label="한국어 이름" value={nameKo} onChange={setNameKo} />
          <Field id={id("en")} label="영어 이름" value={nameEn} onChange={setNameEn} />
          <Field id={id("slug")} label="영문 키 (바꾸지 않는 고유 키)" value={slug} onChange={setSlug} />
          <Field id={id("aliases")} label="다른 이름 (쉼표로 구분)" value={aliases} onChange={setAliases} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("steps")}>세팅 과정 (한 줄에 하나, 3~5줄)</Label>
            <Textarea id={id("steps")} value={steps} onChange={(e) => setSteps(e.target.value)} rows={5} />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          className="flex-1 rounded-full"
          disabled={busy}
          onClick={() => act(() => rejectDraft(draft.id))}
        >
          버림
        </Button>
        <Button className="flex-1 rounded-full" disabled={busy || kind === "unclear"} onClick={approve}>
          {busy && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
          승인
        </Button>
      </div>
    </section>
  );
}

function Field({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// "다른 이름"으로 붙일 기술 고르기 — 기술 추가 검색(D-31)과 같은 검색을 쓴다
function AliasPicker({
  value,
  onChange,
  inputId,
}: {
  value: { slug: string; nameKo: string } | null;
  onChange: (v: { slug: string; nameKo: string }) => void;
  inputId: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; list: { slug: string; nameKo: string; position: string }[] }>({
    q: "",
    list: [],
  });
  const text = query.trim();
  const ready = text.replace(/\s/g, "").length >= 2;

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const t = setTimeout(async () => {
      const list = await searchTechniques(text).catch(() => []);
      if (alive) setResults({ q: text, list: list.slice(0, 5).map((x) => ({ slug: x.id, nameKo: x.nameKo, position: x.position })) });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [text, ready]);

  const list = ready && results.q === text ? results.list : [];
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>붙일 기술</Label>
      {value ? (
        <p className="text-[15px] font-medium">
          → {value.nameKo} <Badge variant="outline">다른 이름에 추가</Badge>
        </p>
      ) : (
        <p className="text-[14px] text-destructive">아직 안 골랐어요.</p>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id={inputId}
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 40))}
          placeholder="다른 기술로 바꾸기 — 이름으로 찾기"
        />
      </div>
      {list.length > 0 && (
        <ul className="flex flex-col">
          {list.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                onClick={() => {
                  onChange({ slug: t.slug, nameKo: t.nameKo });
                  setQuery("");
                }}
                className="w-full rounded-xl px-2 py-2 text-left text-[15px] transition-colors hover:bg-muted"
              >
                {t.nameKo} <span className="text-[12px] text-muted-foreground">{t.position}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
