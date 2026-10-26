import "server-only";
import data from "../../../data/techniques.json";

// 매칭 후보 = 기술 라이브러리(data/techniques.json, DB techniques 의 원본).
// 검수된 기술이 MIN_REVIEWED 개가 되기 전에는 검수 전 초안도 후보로 쓰고, 화면에 "검수 전" 을 붙인다(D-21).

export const MIN_REVIEWED = 20; // M1 최소 검수 개수(TASKS T-01c)

export type Candidate = {
  slug: string;
  nameKo: string;
  nameEn: string;
  position: string; // 포지션 한국어 이름
  aliases: string[];
  steps: string[];
  draft: boolean;
};

type RawTechnique = {
  position: string;
  slug: string;
  name_ko: string;
  name_en: string;
  aliases: string[];
  steps: string[];
  draft: boolean;
};

const positionName = new Map(data.positions.map((p) => [p.slug, p.name_ko]));
// "남북 (노스사우스)" · "하프가드" 처럼 글에 포지션만 나온 경우를 가리기 위한 이름들
export const positionNames = data.positions.flatMap((p) => [p.name_ko, ...p.name_ko.split(/ [·(] ?|\)/)]).filter(Boolean);

const all: Candidate[] = (data.techniques as RawTechnique[]).map((t) => ({
  slug: t.slug,
  nameKo: t.name_ko,
  nameEn: t.name_en,
  position: positionName.get(t.position) ?? t.position,
  aliases: t.aliases,
  steps: t.steps,
  draft: t.draft !== false,
}));

const reviewed = all.filter((t) => !t.draft);

export const includesDrafts = reviewed.length < MIN_REVIEWED;
export const candidates: Candidate[] = includesDrafts ? all : reviewed;
export const bySlug = new Map(candidates.map((t) => [t.slug, t]));
