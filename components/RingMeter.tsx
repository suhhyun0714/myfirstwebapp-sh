import type { ReactNode } from "react";
import { pct } from "@/lib/format";

// 도넛(고리) 한 개: 전체 가운데 한 몫(ratio 0–1)을 빨간 호로. 가운데는 %.
// 휴대폰(좁은 상자)은 고리 위 · 글자 아래, sm 이상은 고리 왼쪽 · 글자 오른쪽 — 상자 크기에 고리를 맞춘다.
// 시리즈가 하나라 범례 대신 제목이 이름을 말한다. 마우스를 올리면 <title>로 값이 보인다.
const R = 46;
const C = 2 * Math.PI * R;

export default function RingMeter({
  title,
  ratio,
  value,
  sub,
  tip,
}: {
  title: string;
  ratio: number | null;
  value: ReactNode;
  sub: ReactNode;
  tip: string;
}) {
  const r = ratio === null ? 0 : Math.max(0, Math.min(1, ratio));
  return (
    <figure className="flex flex-col items-center gap-3 rounded-lg border border-sepia bg-parchment p-4 text-center sm:flex-row sm:justify-center sm:gap-6 sm:text-left">
      <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36 lg:h-40 lg:w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={R} className="fill-none stroke-parchment-deep" strokeWidth="16" />
          {r > 0 ? (
            <circle
              cx="60"
              cy="60"
              r={R}
              className="fill-none stroke-grade-c"
              strokeWidth="16"
              strokeDasharray={`${(r * C).toFixed(2)} ${C.toFixed(2)}`}
            >
              <title>{tip}</title>
            </circle>
          ) : null}
        </svg>
        <span className="num absolute inset-0 flex items-center justify-center text-xl font-bold text-ink lg:text-2xl">
          {pct(ratio)}
        </span>
      </div>
      <figcaption className="min-w-0">
        <span className="block text-sm font-semibold text-sepia">{title}</span>
        <span className="mt-1 block text-xl font-bold text-ink lg:text-2xl">{value}</span>
        <span className="mt-1 block text-xs text-sepia">{sub}</span>
      </figcaption>
      <span className="sr-only">{tip}</span>
    </figure>
  );
}
