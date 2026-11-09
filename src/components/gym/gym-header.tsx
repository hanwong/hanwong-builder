"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { OptionSelect } from "@/components/ui/select";
import { pickGym } from "@/app/gym/actions";
import type { MyGym } from "@/lib/gym-data";
import { GymName, NetworkMark } from "@/components/gym/network-mark";

const ROLE_LABEL = { owner: "관장", coach: "코치", member: "관원" } as const;

// 관장 화면 머리 (DESIGN '관장님 버전') — 체육관 이름 + 역할 칩. 체육관이 여러 개면 이름을 눌러 바꾼다.
export function GymHeader({ gym, all }: { gym: MyGym; all: MyGym[] }) {
  const [, start] = useTransition();
  return (
    <header className="flex items-center gap-2">
      {all.length > 1 ? (
        // 체육관 바꿔 고르기 — 목록에도 로고(D-149)
        <OptionSelect
          value={gym.id}
          onValueChange={(id) => start(() => pickGym(id))}
          aria-label="체육관 고르기"
          className="min-w-0"
          triggerClassName="h-9 w-auto border-0 bg-transparent px-0 text-[17px] font-bold tracking-tight"
          options={all.map((g) => ({ value: g.id, label: g.name, icon: <NetworkMark network={g.network} size={20} /> }))}
        />
      ) : (
        <h1 className="flex min-w-0 text-[17px] font-bold tracking-tight">
          <GymName name={gym.name} network={gym.network} size={20} />
        </h1>
      )}
      <Badge variant="secondary">{ROLE_LABEL[gym.role]}</Badge>
    </header>
  );
}
