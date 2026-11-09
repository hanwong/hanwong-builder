import { Label } from "@/components/ui/label";
import { OptionSelect } from "@/components/ui/select";
import { GYM_NETWORKS, GYM_NETWORK_CONTACT } from "@/lib/gym-shared";
import { NetworkMark } from "@/components/gym/network-mark";

// 소속 네트워크 선택박스 (D-128) — "없음"이 기본, 목록에 없으면 관리자에게 문의
export function NetworkSelect({ value, onChange, id = "gym-network" }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-[15px] font-semibold">
        소속 네트워크 (선택)
      </Label>
      <div className="flex items-center gap-2">
        {/* 목록 · 고른 칸 모두 로고와 함께(D-149) */}
        <OptionSelect
          id={id}
          value={value}
          onValueChange={onChange}
          className="h-12"
          options={[
            { value: "", label: "없음 · 독립 체육관" },
            ...GYM_NETWORKS.map((n) => ({ value: n, label: n, icon: <NetworkMark network={n} size={24} /> })),
          ]}
        />
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        목록에 없는 네트워크는{" "}
        <a href={`mailto:${GYM_NETWORK_CONTACT}?subject=${encodeURIComponent("리리롤 네트워크 추가 요청")}`} className="underline underline-offset-4">
          관리자에게 알려 주세요
        </a>
        . 확인 뒤 더해요.
      </p>
    </div>
  );
}
