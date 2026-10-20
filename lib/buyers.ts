import { db } from "@/lib/db";

// 바이어 데이터 읽기 — Supabase DB의 Buyer 표에서 읽는다(서버 전용).
export type Grade = "S" | "A" | "B" | "C";

export type Buyer = {
  id: string;
  name: string;
  countryCode: string;
  countryKo: string;
  region: string;
  industry: string;
  paymentMethod: string;
  termsDays: number;
  openArUsd: number;
  overdueUsd: number;
  pctAr31p: number | null; // 0–1
  oldestOpenDays: number;
  avgDaysLate12m: number | null;
  pd30d: number; // 0–1
  grade: Grade;
  signals: string[];
};

// Prisma가 돌려주는 형은 grade가 string이라 한 번만 맞춘다.
export async function getBuyers(): Promise<Buyer[]> {
  return (await db().buyer.findMany({ orderBy: { id: "asc" } })) as Buyer[];
}

/** id는 대문자로 맞춰 찾는다(b048 → B048). 없으면 null. */
export async function getBuyer(id: string): Promise<Buyer | null> {
  return (await db().buyer.findUnique({ where: { id: id.toUpperCase() } })) as Buyer | null;
}
