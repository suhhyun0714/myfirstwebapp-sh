import type { ReactNode } from "react";
import Link from "next/link";

// 양피지 막대 한 줄: 위에 이름(링크 가능) · 값, 아래에 막대(value ÷ max). 휴대폰에서도 한 줄 흐름.
export default function ParchmentBar({
  label,
  href,
  value,
  max,
  display,
  sub,
}: {
  label: string;
  href?: string | null;
  value: number;
  max: number;
  display: ReactNode;
  sub?: string;
}) {
  const width = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="py-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        {href ? (
          <Link href={href} className="flex min-h-11 items-center font-semibold text-ink underline decoration-sepia underline-offset-4">
            {label}
          </Link>
        ) : (
          <span className="flex min-h-11 items-center font-semibold text-ink">{label}</span>
        )}
        <span className="text-right text-sm">
          <span className="font-semibold text-ink">{display}</span>
          {sub ? <span className="num ml-2 text-sepia">{sub}</span> : null}
        </span>
      </div>
      <span className="block h-3 rounded-sm bg-parchment-deep" aria-hidden="true">
        <span className="block h-3 rounded-sm bg-sepia" style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}
