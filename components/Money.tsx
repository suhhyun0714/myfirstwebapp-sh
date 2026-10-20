import { krwApprox, usd } from "@/lib/format";

// 달러 금액 + 작은 원화 어림(오늘 환율 · 백만원 단위). rate는 서버(lib/fx.ts)에서 받아 props로 내려준다.
// stack이면 원화를 아래 줄에, 아니면 같은 줄 뒤에 붙인다(숫자 가운데서는 끊기지 않는다).
export function KrwNote({ usdValue, rate }: { usdValue: number; rate: number }) {
  return <span className="num text-xs font-normal text-sepia">({krwApprox(usdValue * rate)})</span>;
}

export default function Money({
  value,
  rate,
  stack = false,
  className = "",
}: {
  value: number;
  rate: number;
  stack?: boolean;
  className?: string;
}) {
  return (
    <span className={stack ? "inline-flex flex-col" : "inline-flex flex-wrap items-baseline gap-x-1"}>
      <span className={`num ${className}`}>{usd(value)}</span>
      <KrwNote usdValue={value} rate={rate} />
    </span>
  );
}
