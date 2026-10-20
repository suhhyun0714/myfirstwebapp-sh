import saved from "@/data/fx_fallback.json";
import { kst } from "@/lib/format";

// 환율 레이더 — USD 기준 KRW · EUR · JPY · CNY. 60초 동안 같은 응답을 다시 쓴다(배포 주소에서).
// 못 받거나(시간 초과 · 오류 · 검사 실패) FX_FORCE_FALLBACK="1"이면 data/fx_fallback.json의 최신 블록을 '대체 값'으로 낸다.
export const revalidate = 60;

const ENDPOINT = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW,EUR,JPY,CNY";
const PROVIDER = "api.frankfurter.dev";
const QUOTES = ["KRW", "EUR", "JPY", "CNY"] as const;

type Rates = Record<(typeof QUOTES)[number], number>;

/** [{ date, base, quote, rate }, …]에서 네 통화가 모두 있고 rate > 0인지 검사한다. 하나라도 어긋나면 null. */
function parseRates(list: unknown): { date: string; rates: Rates } | null {
  if (!Array.isArray(list)) return null;
  const rates = {} as Rates;
  let date = "";
  for (const quote of QUOTES) {
    const row: unknown = list.find((r) => r && typeof r === "object" && r.quote === quote && r.base === "USD");
    if (!row || typeof row !== "object") return null;
    const { rate, date: d } = row as { rate?: unknown; date?: unknown };
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0 || typeof d !== "string") return null;
    rates[quote] = rate;
    if (quote === "KRW") date = d;
  }
  return { date, rates };
}

async function fetchLive() {
  try {
    const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return parseRates(await res.json());
  } catch {
    return null;
  }
}

export async function GET() {
  const live = process.env.FX_FORCE_FALLBACK === "1" ? null : await fetchLive();
  const now = new Date();
  const stamp = { fetchedAt: now.toISOString(), fetchedAtKst: kst(now, true) };

  if (live) {
    return Response.json({ date: live.date, base: "USD", rates: live.rates, ...stamp, provider: PROVIDER, fallback: false });
  }

  const backup = parseRates(saved.latest);
  if (!backup) {
    return Response.json({ error: "환율 확인 필요" }, { status: 503 });
  }
  return Response.json({
    date: backup.date,
    base: "USD",
    rates: backup.rates,
    ...stamp,
    provider: saved.provider,
    fallback: true,
    savedAt: saved.savedAt,
    savedAtKst: kst(saved.savedAt, true),
  });
}
