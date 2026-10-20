import type { ReactNode } from "react";
import Link from "next/link";
import GradeBadge from "@/components/GradeBadge";
import Money, { KrwNote } from "@/components/Money";
import type { Buyer } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";
import { recovery, type RecoveryLevel } from "@/lib/overdue";

// 연체 바이어 한 줄(<details>).
// 접힌 줄 = 표 한 줄: 회사 · 등급 · 연체 금액 · 밀린 날 · 회수 가능성(넓은 화면은 OverdueListHeader와 칸이 맞는다).
// 펼치면: 핵심 숫자 4칸(금액 · 기간 · 과거 이력 · 회수 가능성) → 확인 필요 2칸(거래 건수와 품목 · 진행 상황) → 신호 → 자료 단추.
// 데이터에 없는 것(거래 건수 · 품목 · 진행 상황)은 지어내지 않고 '확인 필요'로 둔다.

const companyLink = (name: string) => `https://opencorporates.com/companies?q=${encodeURIComponent(name)}`;
const newsLink = (name: string) =>
  `https://news.google.com/search?q=${encodeURIComponent(`"${name}"`)}&hl=ko&gl=KR&ceid=KR:ko`;

const RECOVERY: Record<RecoveryLevel, { label: string; className: string }> = {
  high: { label: "회수 높음", className: "bg-grade-s" },
  mid: { label: "회수 보통", className: "bg-grade-b" },
  low: { label: "회수 낮음", className: "bg-grade-c" },
};

export function RecoveryBadge({ level }: { level: RecoveryLevel }) {
  const r = RECOVERY[level];
  return (
    <span className={`inline-flex min-w-16 items-center justify-center rounded px-2 py-0.5 text-xs font-semibold text-white ${r.className}`}>
      {r.label}
    </span>
  );
}

const ROW = "md:grid md:grid-cols-12 md:items-center md:gap-x-3";

/** 넓은 화면에서만 보이는 열 이름 줄 */
export function OverdueListHeader() {
  return (
    <div className={`hidden px-3 pb-1 text-xs font-semibold text-sepia ${ROW}`} aria-hidden="true">
      <span className="col-span-5">회사</span>
      <span className="col-span-1">등급</span>
      <span className="col-span-2 text-right">연체 금액</span>
      <span className="col-span-2 text-right">밀린 날</span>
      <span className="col-span-2 pr-7 text-right">회수 가능성</span>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: ReactNode; sub: ReactNode }) {
  return (
    <div className="rounded-md border border-sepia bg-bg p-3">
      <p className="text-xs font-semibold text-sepia">{label}</p>
      <div className="mt-1 text-base font-bold text-ink sm:text-lg">{value}</div>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

const button =
  "inline-flex min-h-11 items-center rounded-md border border-sepia bg-parchment px-3 text-sm font-semibold text-ink hover:bg-parchment-deep";

export default function OverdueBuyerItem({ buyer: b, rank, rate }: { buyer: Buyer; rank?: number; rate: number }) {
  const level = recovery(b);
  return (
    <details className="group/item rounded-lg border border-sepia bg-parchment">
      <summary
        className={`report-summary flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 rounded-lg p-3 hover:bg-parchment-deep ${ROW}`}
      >
        <span className="w-full min-w-0 md:col-span-5 md:w-auto">
          <span className="block font-semibold text-ink">
            {rank ? `${rank}. ` : ""}
            {b.name}
          </span>
          <span className="block text-xs text-sepia">
            <span className="num">{b.id}</span> · {b.countryKo}
          </span>
        </span>
        <span className="md:col-span-1">
          <span className="inline-flex rounded bg-bg">
            <GradeBadge grade={b.grade} />
          </span>
        </span>
        <span className="text-ink md:col-span-2 md:text-right">
          <Money value={b.overdueUsd} rate={rate} stack className="font-bold" />
        </span>
        <span className="num text-sm text-sepia md:col-span-2 md:text-right">{int(b.oldestOpenDays)}일째</span>
        <span className="ml-auto flex items-center gap-2 md:col-span-2 md:justify-end">
          <RecoveryBadge level={level} />
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 stroke-sepia transition-transform group-open/item:rotate-180"
            fill="none"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>

      <div className="space-y-4 border-t border-sepia p-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Tile
            label="연체 금액"
            value={<Money value={b.overdueUsd} rate={rate} stack />}
            sub={
              <>
                채권 <span className="num">{usd(b.openArUsd)}</span> 중 <KrwNote usdValue={b.openArUsd} rate={rate} />
              </>
            }
          />
          <Tile
            label="연체 기간"
            value={<span className="num">{int(b.oldestOpenDays)}일째</span>}
            sub={
              <>
                {b.paymentMethod} · <span className="num">{b.termsDays}일</span> 조건
              </>
            }
          />
          <Tile
            label="과거 연체 이력"
            value={b.avgDaysLate12m === null ? "기록 없음" : <span className="num">평균 {b.avgDaysLate12m.toFixed(1)}일 지연</span>}
            sub="최근 1년 지급 기준"
          />
          <Tile
            label="회수 가능성"
            value={<RecoveryBadge level={level} />}
            sub={
              <>
                <span className="num">{int(b.oldestOpenDays)}일째</span> · 위험 점수 <span className="num">{pct(b.pd30d)}</span>
              </>
            }
          />
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="font-semibold text-sepia">연체 거래 건수 · 품목</dt>
            <dd className="text-grade-c">확인 필요</dd>
            <dd className="w-full text-xs text-muted">인보이스별 자료가 없습니다 · 업종: {b.industry}</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="font-semibold text-sepia">진행 상황</dt>
            <dd className="text-grade-c">기록 없음</dd>
            <dd className="w-full text-xs text-muted">담당자 확인 필요</dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-semibold text-sepia">확인할 신호 — 원인이 아니라 확인할 이유</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {b.signals.map((s) => (
              <li key={s} className="rounded border border-sepia bg-bg px-2 py-0.5 text-xs text-ink">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-sepia">최신 동향 · 자료 보기</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <a href={newsLink(b.name)} target="_blank" rel="noopener noreferrer" className={button}>
              최근 뉴스(새 탭)
            </a>
            <a href={companyLink(b.name)} target="_blank" rel="noopener noreferrer" className={button}>
              기업 등록 · 재무 정보(새 탭)
            </a>
            <Link href={`/buyers/${b.id}`} className={button}>
              {b.id} 상세 쪽
            </Link>
          </div>
          <p className="mt-1 text-xs text-muted">(가상) 바이어 — 바깥 검색 결과는 이 바이어와 다를 수 있습니다.</p>
        </div>
      </div>
    </details>
  );
}
