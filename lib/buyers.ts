import raw from "@/data/buyers.json";

// 바이어 데이터 읽기. 지금은 JSON을 돌려줄 뿐이지만 async로 둔다 — 5일차에 DB로 바꿀 때 두 함수의 속만 바뀐다.
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

// JSON에서 추론한 형은 grade가 string이라 한 번만 맞춘다.
const buyers = raw as Buyer[];

export async function getBuyers(): Promise<Buyer[]> {
  return buyers;
}

/** id는 대문자로 맞춰 찾는다(b048 → B048). 없으면 null. */
export async function getBuyer(id: string): Promise<Buyer | null> {
  const key = id.toUpperCase();
  return buyers.find((b) => b.id === key) ?? null;
}
