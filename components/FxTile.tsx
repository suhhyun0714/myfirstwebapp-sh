"use client";

import { useEffect, useState } from "react";
import { fx, int, krw, usd } from "@/lib/format";

// 환율 타일 — /api/fx를 마운트할 때 한 번, 그 뒤 60초마다 받는다(화면 움직임만).
// 달러 합은 서버(app/page.tsx)가 계산해 props로 준다. 원화 = Math.round(usd × rate) 한 번만.

type FxData = {
  date: string;
  rates: { KRW: number };
  fetchedAtKst: string;
  provider: string;
  fallback: boolean;
  savedAtKst?: string;
};

const REFRESH_MS = 60_000;

/** 차이 글자: +1,234원 · −1,234원 · 0원 */
function signedKrw(v: number): string {
  if (v === 0) return krw(0);
  return `${v > 0 ? "+" : "−"}${krw(Math.abs(v))}`;
}

export default function FxTile({
  cArUsd,
  overdueUsd,
  overdueCount,
  base,
}: {
  cArUsd: number;
  overdueUsd: number;
  overdueCount: number;
  base: { date: string; krw: number | null };
}) {
  const [data, setData] = useState<FxData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/fx", { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        setData((await res.json()) as FxData);
        setFailed(false);
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      clearInterval(timer);
      ctrl.abort();
    };
  }, []);

  const rate = data?.rates.KRW;
  const toKrw = (v: number, r: number | null | undefined) => (typeof r === "number" ? Math.round(v * r) : null);
  const cToday = toKrw(cArUsd, rate);
  const cBase = toKrw(cArUsd, base.krw);
  const overdueToday = toKrw(overdueUsd, rate);
  const time = data?.fetchedAtKst.split(" ")[1] ?? "—";
  const [, mm, dd] = base.date.split("-");
  const baseLabel = `${Number(mm)}/${Number(dd)}`; // 2026-09-30 → 9/30

  return (
    <section aria-labelledby="fx-tile" className="rounded-lg border border-line bg-surface p-4">
      <h2 id="fx-tile" className="text-sm text-muted">
        지금 환율로 본 원화
      </h2>

      {!data ? (
        <p className="mt-2 text-ink">{failed ? "환율 확인 필요 — 잠시 뒤 다시 받습니다" : "환율 받는 중…"}</p>
      ) : (
        <>
          <p className="num mt-1 text-2xl font-bold text-ink sm:text-3xl">{krw(cToday)}</p>
          <p className="text-sm text-muted">
            C등급 <span className="num">{usd(cArUsd)}</span> × 오늘 환율
          </p>

          <ul className="mt-3 space-y-1 text-sm text-ink">
            <li className="flex flex-wrap gap-x-2">
              <span className="num">1 USD = {fx(rate)}원</span>
              <span className="num">· {data.date}</span>
              <span>· {data.provider}</span>
              <span>
                · 받은 시각 <span className="num">{time}</span>
              </span>
            </li>
            <li className="flex flex-wrap gap-x-2">
              <span>
                {baseLabel} 기준 <span className="num">{fx(base.krw)}원</span>
              </span>
              <span>
                → C등급 <span className="num">{usd(cArUsd)}</span> = <span className="num">{krw(cBase)}</span>
              </span>
              <span>
                · 오늘 − {baseLabel}{" "}
                <span className="num font-semibold">
                  {cToday !== null && cBase !== null ? signedKrw(cToday - cBase) : "확인 필요"}
                </span>
              </span>
            </li>
            <li className="flex flex-wrap gap-x-2">
              <span>
                연체 <span className="num">{int(overdueCount)}곳</span> <span className="num">{usd(overdueUsd)}</span>
              </span>
              <span>
                = <span className="num">{krw(overdueToday)}</span>(오늘 환율)
              </span>
            </li>
          </ul>

          {data.fallback ? (
            <p className="mt-3 inline-block rounded border border-warn px-2 py-1 text-sm font-semibold text-warn">
              대체 값 · 저장 시각 <span className="num">{data.savedAtKst ?? "확인 필요"}</span>
            </p>
          ) : null}
          {failed ? <p className="mt-2 text-sm text-warn">새 환율을 받지 못해 앞서 받은 값을 보입니다</p> : null}
        </>
      )}

      <p className="mt-3 text-xs text-muted">환율은 참고값입니다 — 결제 · 회계 기준이 아닙니다</p>
    </section>
  );
}
