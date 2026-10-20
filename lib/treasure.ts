import type { Buyer } from "@/lib/buyers";
import { byRegion, kpis } from "@/lib/metrics";

// 보물 지도(/regions) 계산 — 순수 함수만 · 화면 글자 없음. 그림 수 · 해적 바다 · 한빛 깃발의 기준은 모두 여기서 정한다.

export const MAX_CHESTS = 5;

// 지역 이름 → 주소용 짧은 이름(한글 · '·'이 든 주소는 보낼 때 깨져 보인다)
const SLUGS: Record<string, string> = {
  "동남아·남아": "south-asia",
  동아시아: "east-asia",
  "북미·중남미": "americas",
  서유럽: "western-europe",
  "중동·아프리카": "middle-east-africa",
  중동부유럽: "central-europe",
};

export function regionSlug(region: string): string | null {
  return SLUGS[region] ?? null;
}

export function regionFromSlug(slug: string): string | null {
  const key = slug.toLowerCase();
  return Object.keys(SLUGS).find((r) => SLUGS[r] === key) ?? null;
}

/** 보물상자 수: 값이 0이면 0, 아니면 value ÷ max × 5를 반올림하되 1–5 */
export function chestCount(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(MAX_CHESTS, Math.max(1, Math.round((value / max) * MAX_CHESTS)));
}

/**
 * 섬(지역) 6곳 — 채권 합이 큰 순.
 * chests: 채권 합 ÷ 가장 큰 지역 합 × 5
 * pirate(해골 + 해적선): 지역 C등급 비중 > 전체 C등급 비중
 * flag(한빛 깃발): 해적 바다가 아니고, 지역 연체 비중(연체 ÷ 채권) < 전체 연체 비중
 */
export function treasureMap(buyers: Buyer[]) {
  const k = kpis(buyers);
  const overdueShareAll = k.arAll > 0 ? k.overdue / k.arAll : null;
  const regions = byRegion(buyers);
  const maxAr = Math.max(0, ...regions.map((r) => r.ar));

  const islands = regions.map((r) => {
    const list = buyers.filter((b) => b.region === r.region);
    const overdue = list.reduce((s, b) => s + b.overdueUsd, 0);
    const overdueCount = list.filter((b) => b.overdueUsd > 0).length;
    const overdueShare = r.ar > 0 ? overdue / r.ar : null;
    const pirate = r.shareC !== null && k.shareC !== null && r.shareC > k.shareC;
    const flag = !pirate && overdueShare !== null && overdueShareAll !== null && overdueShare < overdueShareAll;
    return {
      ...r,
      slug: regionSlug(r.region),
      overdue,
      overdueCount,
      overdueShare,
      chests: chestCount(r.ar, maxAr),
      pirate,
      flag,
    };
  });

  return { islands, shareCAll: k.shareC, overdueShareAll };
}

export type Island = ReturnType<typeof treasureMap>["islands"][number];

/** 연체 큰 순, 같으면 id 순 */
export function byOverdue(buyers: Buyer[]): Buyer[] {
  return [...buyers].sort((a, b) => b.overdueUsd - a.overdueUsd || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** 바이어 보물상자의 기준 — 150곳 중 가장 큰 연체 */
export function maxOverdue(buyers: Buyer[]): number {
  return Math.max(0, ...buyers.map((b) => b.overdueUsd));
}
