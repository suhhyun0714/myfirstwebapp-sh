import { db } from "@/lib/db";

// 확인 기록 읽기(서버 전용). 최신이 위 — 같은 시각이면 나중에 넣은 것이 위.
const NEWEST_FIRST = [{ createdAt: "desc" as const }, { id: "desc" as const }];

export async function getReviews(buyerId: string, take = 20) {
  return db().review.findMany({ where: { buyerId }, orderBy: NEWEST_FIRST, take });
}

export type LatestReview = { status: string; memo: string; reviewer: string; createdAt: Date };

/** 바이어마다 가장 최근 기록 1건(id → 기록). 기록이 없는 바이어는 빠진다. */
export async function getLatestReviewByBuyer(): Promise<Map<string, LatestReview>> {
  const rows = await db().review.findMany({
    orderBy: NEWEST_FIRST,
    select: { buyerId: true, status: true, memo: true, reviewer: true, createdAt: true },
  });
  const latest = new Map<string, LatestReview>();
  for (const { buyerId, ...r } of rows) if (!latest.has(buyerId)) latest.set(buyerId, r);
  return latest;
}

export async function getRecentReviews(take = 5) {
  return db().review.findMany({
    orderBy: NEWEST_FIRST,
    take,
    include: { buyer: { select: { name: true } } },
  });
}
