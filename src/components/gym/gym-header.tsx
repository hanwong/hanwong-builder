"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { pickGym } from "@/app/gym/actions";
import type { MyGym } from "@/lib/gym-data";
import { NetworkMark } from "@/components/gym/network-mark";

const ROLE_LABEL = { owner: "관장", coach: "코치", member: "관원" } as const;

// 관장 화면 머리 (DESIGN '관장님 버전') — 체육관 이름 + 역할 칩. 체육관이 여러 개면 이름을 눌러 바꾼다.
export function GymHeader({ gym, all }: { gym: MyGym; all: MyGym[] }) {
  const [, start] = useTransition();
  return (
    <header className="flex items-center gap-2">
      {all.length > 1 ? (
        <label className="relative flex min-w-0 items-center gap-1">
          <span className="sr-only">체육관 고르기</span>
          <NativeSelect
            value={gym.id}
            onChange={(e) => {
              const id = e.target.value;
              start(() => pickGym(id));
            }}
            className="h-9 min-w-0 appearance-none border-0 bg-transparent pr-6 pl-0 text-[17px] font-bold tracking-tight shadow-none"
          >
            {all.map((g) => (
              <NativeSelectOption key={g.id} value={g.id}>
                {g.network ? `${g.name} · ${g.network}` : g.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <ChevronDown className="pointer-events-none absolute right-1 size-4 text-muted-foreground" aria-hidden />
        </label>
      ) : (
        <h1 className="min-w-0 truncate text-[17px] font-bold tracking-tight">{gym.name}</h1>
      )}
      {gym.network && (
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-muted-foreground">
          · <NetworkMark network={gym.network} size={16} /> {gym.network}
        </span>
      )}
      <Badge variant="secondary">{ROLE_LABEL[gym.role]}</Badge>
    </header>
  );
}
