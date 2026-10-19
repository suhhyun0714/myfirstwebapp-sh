import Link from "next/link";
import BarRow from "@/components/BarRow";
import DataTable, { type Column } from "@/components/DataTable";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { getBuyers, type Buyer } from "@/lib/buyers";
import { byRegion, filterByGrade, gradeCounts, isGrade, kpis, topRisk } from "@/lib/metrics";
import { int, pct, usd } from "@/lib/format";

export const metadata = { title: "바이어" };

// 바이어 이름(링크) + 아래 작게 id. 휴대폰 카드에서는 이 칸이 제목이 된다.
function BuyerCell({ buyer, rank }: { buyer: Buyer; rank?: number }) {
  return (
    <div>
      <Link href={`/buyers/${buyer.id}`} className="flex min-h-11 items-center font-semibold text-accent hover:underline">
        {rank ? `${rank}. ${buyer.name}` : buyer.name}
      </Link>
      <span className="num block text-xs text-muted">{buyer.id}</span>
    </div>
  );
}

function baseRow(b: Buyer, rank?: number) {
  return {
    buyer: <BuyerCell buyer={b} rank={rank} />,
    country: b.countryKo,
    grade: <GradeBadge grade={b.grade} />,
    pd: pct(b.pd30d),
    ar: usd(b.openArUsd),
    overdue: usd(b.overdueUsd),
  };
}

const BASE_COLUMNS: Column[] = [
  { key: "buyer", label: "바이어" },
  { key: "country", label: "나라" },
  { key: "grade", label: "등급" },
  { key: "pd", label: "위험 점수", align: "right" },
  { key: "ar", label: "채권", align: "right" },
  { key: "overdue", label: "연체", align: "right" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ grade?: string | string[] }> }) {
  const sp = await searchParams;
  const rawGrade = Array.isArray(sp.grade) ? sp.grade[0] : sp.grade;
  const upper = rawGrade?.toUpperCase();
  const selected = isGrade(upper) ? upper : null;

  const buyers = await getBuyers();
  const k = kpis(buyers);
  const counts = gradeCounts(buyers);
  const top = topRisk(buyers, 10);
  const regions = byRegion(buyers);
  const regionMax = Math.max(0, ...regions.map((r) => r.ar));
  const shareMax = Math.max(...regions.map((r) => r.shareC ?? -1));
  const list = filterByGrade(buyers, selected);

  const chips = [
    { href: "/buyers", label: "전체", count: k.count, active: selected === null },
    ...counts.map((c) => ({
      href: `/buyers?grade=${c.grade}`,
      label: c.grade,
      count: c.count,
      active: selected === c.grade,
    })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`바이어 ${int(k.count)}곳`}
        asof="2026-09-30 · (가상) 합성 데이터"
        line="위험 점수는 판단을 돕는 값이고, 결정은 사람이 합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="위험 바이어(C등급)" value={`${int(k.countC)}곳`} />
        <KpiCard label="C등급 채권" value={usd(k.arC)} sub={`전체의 ${pct(k.shareC)}`} />
        <KpiCard label="전체 채권" value={usd(k.arAll)} sub={`${int(k.count)}곳`} />
        <KpiCard label="연체 금액" value={usd(k.overdue)} sub={`${int(k.overdueCount)}곳`} />
      </section>

      <section aria-labelledby="top-risk" className="space-y-3">
        <h2 id="top-risk" className="text-lg font-bold text-ink">
          위험 상위 10
        </h2>
        <DataTable
          caption="위험 점수가 큰 순(같으면 바이어 번호 순)"
          columns={[...BASE_COLUMNS, { key: "signal", label: "첫 신호" }]}
          rows={top.map((b, i) => ({ ...baseRow(b, i + 1), signal: b.signals[0] ?? "—" }))}
        />
      </section>

      <section aria-labelledby="by-region" className="space-y-3">
        <h2 id="by-region" className="text-lg font-bold text-ink">
          지역별 채권
        </h2>
        <div className="rounded-lg border border-line p-4">
          {regions.map((r) => {
            const strong = r.shareC !== null && r.shareC === shareMax;
            return (
              <div key={r.region} className="border-b border-line py-1 last:border-b-0">
                <BarRow label={r.region} value={r.ar} max={regionMax} display={usd(r.ar)} strong={strong} />
                <p className={`text-xs ${strong ? "font-semibold text-ink" : "text-muted"}`}>
                  C등급 <span className="num">{usd(r.arC)}</span> · <span className="num">{pct(r.shareC)}</span>
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="all-buyers" className="space-y-3">
        <h2 id="all-buyers" className="text-lg font-bold text-ink">
          전체 목록
        </h2>
        <nav aria-label="등급으로 거르기">
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  aria-current={c.active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-4 text-sm ${
                    c.active ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-surface"
                  }`}
                >
                  {c.label} <span className="num">{int(c.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted">
          {selected ? `${selected}등급` : "전체"} <span className="num">{int(list.length)}곳</span>
        </p>
        <DataTable columns={BASE_COLUMNS} rows={list.map((b) => baseRow(b))} />
      </section>
    </div>
  );
}
