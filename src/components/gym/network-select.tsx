import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { GYM_NETWORKS, GYM_NETWORK_CONTACT } from "@/lib/gym-shared";

// 소속 네트워크 선택박스 (D-128) — "없음"이 기본, 목록에 없으면 관리자에게 문의
export function NetworkSelect({ value, onChange, id = "gym-network" }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-[15px] font-semibold">
        소속 네트워크 (선택)
      </Label>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl text-base">
        <NativeSelectOption value="">없음 · 독립 체육관</NativeSelectOption>
        {GYM_NETWORKS.map((n) => (
          <NativeSelectOption key={n} value={n}>
            {n}
          </NativeSelectOption>
        ))}
      </NativeSelect>
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
