import { preload } from "react-dom";
import { getImageProps } from "next/image";
import { pickerData, type PickerData, type PickerTechnique } from "@/app/app/log/actions";
import { indexList, rank, type Indexed } from "@/lib/matching/rank";

// 기술 고르기 데이터 (D-56, 속도) — 기록 화면이 열릴 때 한 번 받아 브라우저에 둔다.
// 포지션 목록 · 검색은 서버를 다시 부르지 않고 여기서 바로 한다. 저장 · 내용 생성 뒤에는 forgetPicker() 로 새로 받는다.
export type PickerStore = PickerData & {
  index: Indexed<PickerTechnique>[];
  byPosition: Map<string, PickerTechnique[]>;
};

let cache: Promise<PickerStore> | null = null;

export function loadPicker(): Promise<PickerStore> {
  if (!cache) {
    cache = pickerData()
      .then((d) => {
        const byPosition = new Map<string, PickerTechnique[]>();
        for (const t of d.techniques) {
          const list = byPosition.get(t.positionSlug ?? "") ?? [];
          list.push(t);
          byPosition.set(t.positionSlug ?? "", list);
        }
        preloadPictures(d.positions.map((p) => p.slug));
        return { ...d, index: indexList(d.techniques), byPosition };
      })
      .catch((e) => {
        cache = null; // 실패하면 다음에 다시 시도
        throw e;
      });
  }
  return cache;
}

export function forgetPicker() {
  cache = null;
}

// 서버 검색과 같은 순서: 내가 만든 기술 먼저(3개까지), 합쳐 8개
export function searchPicker(store: PickerStore, query: string): PickerTechnique[] {
  const mine = rank(
    store.index.filter((e) => e.t.mine),
    query,
    3,
  );
  const rest = rank(
    store.index.filter((e) => !e.t.mine),
    query,
    8 - mine.length,
  );
  return [...mine, ...rest];
}

// 고르기 팝업의 포지션 그림(112px)을 미리 받아 둔다 — 팝업을 열 때 빈 칸이 보이지 않게
export const PICKER_PICTURE = 112;
function preloadPictures(slugs: string[]) {
  for (const slug of slugs) {
    const { props } = getImageProps({ src: `/positions/${slug}.png`, alt: "", width: PICKER_PICTURE, height: PICKER_PICTURE });
    preload(props.src, { as: "image", imageSrcSet: props.srcSet, fetchPriority: "low" });
  }
}
