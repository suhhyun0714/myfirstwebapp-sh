import type { Buyer } from "@/lib/buyers";
import { kpis } from "@/lib/metrics";
import { byOverdue, regionSlug } from "@/lib/treasure";

// 연체 보고(/overdue) 계산 — 순수 함수만 · 화면 글자 없음(구간 이름만 둔다).

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);
const sumOverdue = (list: Buyer[]) => list.reduce((s, b) => s + b.overdueUsd, 0);

/** 연체 기간 구간 — 가장 오래 밀린 인보이스의 일수(oldestOpenDays) 기준 */
export const AGE_BUCKETS = [
  { label: "30일 이하", min: 0, max: 30 },
  { label: "31–60일", min: 31, max: 60 },
  { label: "61–90일", min: 61, max: 90 },
  { label: "91일 넘음", min: 91, max: Number.POSITIVE_INFINITY },
] as const;

/**
 * 회수 가능성(규칙으로 매긴 참고 값 — 데이터에 있는 칸이 아니다).
 * low: 가장 오래 밀린 인보이스가 91일 넘음 · 또는 위험 점수(pd30d) 50% 이상
 * mid: 31–90일 · 또는 위험 점수 20–50%
 * high: 30일 이하이고 위험 점수 20% 미만
 */
export const RECOVERY_RULE = { lowDays: 90, lowScore: 0.5, midDays: 30, midScore: 0.2 } as const;
export type RecoveryLevel = "high" | "mid" | "low";

export function recovery(b: Buyer): RecoveryLevel {
  const R = RECOVERY_RULE;
  if (b.oldestOpenDays > R.lowDays || b.pd30d >= R.lowScore) return "low";
  if (b.oldestOpenDays > R.midDays || b.pd30d >= R.midScore) return "mid";
  return "high";
}

export function overdueReport(buyers: Buyer[]) {
  const k = kpis(buyers);
  const list = byOverdue(buyers.filter((b) => b.overdueUsd > 0));
  const total = sumOverdue(list);

  const listC = list.filter((b) => b.grade === "C");
  const amountC = sumOverdue(listC);

  // 31일 넘긴 채권 = 채권 × 31일 넘긴 비중. 비중이 빈 줄의 채권은 따로 센다(0으로 셈하지 않는다).
  const aged31 = buyers.reduce((s, b) => s + (b.pctAr31p === null ? 0 : b.openArUsd * b.pctAr31p), 0);
  const agedUnknown = buyers.filter((b) => b.pctAr31p === null).reduce((s, b) => s + b.openArUsd, 0);

  const regionMap = new Map<string, Buyer[]>();
  for (const b of list) regionMap.set(b.region, [...(regionMap.get(b.region) ?? []), b]);
  const regions = [...regionMap.entries()]
    .map(([region, rows]) => ({
      region,
      slug: regionSlug(region),
      count: rows.length,
      amount: sumOverdue(rows),
      buyers: rows, // list가 이미 연체 큰 순이라 그 순서 그대로
    }))
    .sort((a, b) => b.amount - a.amount);

  const countryMap = new Map<string, Buyer[]>();
  for (const b of list) countryMap.set(b.countryKo, [...(countryMap.get(b.countryKo) ?? []), b]);
  const countries = [...countryMap.entries()]
    .map(([country, rows]) => ({
      country,
      region: rows[0].region,
      count: rows.length,
      amount: sumOverdue(rows),
      low: rows.filter((b) => recovery(b) === "low").length,
      buyers: rows,
    }))
    .sort((a, b) => b.amount - a.amount || (a.country < b.country ? -1 : 1));

  const recoveryCounts = (["high", "mid", "low"] as const).map((level) => {
    const rows = list.filter((b) => recovery(b) === level);
    return { level, count: rows.length, amount: sumOverdue(rows) };
  });

  const aging = AGE_BUCKETS.map((g) => {
    const rows = list.filter((b) => b.oldestOpenDays >= g.min && b.oldestOpenDays <= g.max);
    return { label: g.label, min: g.min, count: rows.length, amount: sumOverdue(rows) };
  });

  return {
    k,
    list,
    total,
    shareOfAr: ratio(total, k.arAll),
    gradeC: { count: listC.length, amount: amountC, share: ratio(amountC, total) },
    aged31,
    aged31Share: ratio(aged31, k.arAll),
    agedUnknown,
    regions,
    countries,
    recoveryCounts,
    aging,
  };
}
