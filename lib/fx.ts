import fallbackFile from "@/data/fx_fallback.json";

// 오늘 USD → KRW 환율(서버에서만). api.frankfurter.dev(키 없음)에서 받아 10분 동안 다시 쓰고,
// 못 받으면 data/fx_fallback.json의 최신 저장본을 쓴다(fallback: true — 화면에 '예비 환율'로 밝힌다).
// 환율은 참고값이다 — 결제 · 회계 기준이 아니다.

const URL = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW";

export type UsdKrw = { rate: number; date: string; source: string; fallback: boolean };

type Row = { date?: unknown; quote?: unknown; rate?: unknown };

export async function getUsdKrw(): Promise<UsdKrw> {
  try {
    const res = await fetch(URL, { next: { revalidate: 600 }, signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const rows = (await res.json()) as unknown;
      const krw = Array.isArray(rows) ? (rows as Row[]).find((r) => r?.quote === "KRW") : undefined;
      if (krw && typeof krw.rate === "number" && krw.rate > 0 && typeof krw.date === "string") {
        return { rate: krw.rate, date: krw.date, source: "api.frankfurter.dev", fallback: false };
      }
    }
  } catch {
    // 시간 초과 · 네트워크 오류 → 아래 저장본
  }
  const saved = fallbackFile.latest.find((r) => r.quote === "KRW");
  return { rate: saved?.rate ?? Number.NaN, date: saved?.date ?? "확인 필요", source: "저장본", fallback: true };
}
