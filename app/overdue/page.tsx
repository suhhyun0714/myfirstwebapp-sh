import Money from "@/components/Money";
import OverdueBuyerItem, { OverdueListHeader, RecoveryBadge } from "@/components/OverdueBuyerItem";
import PageHeader from "@/components/PageHeader";
import ParchmentBar from "@/components/ParchmentBar";
import RingMeter from "@/components/RingMeter";
import { getBuyers } from "@/lib/buyers";
import { fx, int, pct } from "@/lib/format";
import { getUsdKrw } from "@/lib/fx";
import { overdueReport, RECOVERY_RULE } from "@/lib/overdue";

export const metadata = { title: "연체 보고" };

const SHOW_FIRST = 7; // 연체 바이어 목록은 7곳까지 먼저 보이고 나머지는 접어 둔다
const TOP_COUNTRIES = 3; // 나라별 연체는 상위 3개국까지

function Chevron({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 stroke-sepia transition-transform ${className}`} fill="none" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default async function Page() {
  const [buyers, fxRate] = await Promise.all([getBuyers(), getUsdKrw()]);
  const rate = fxRate.rate;
  const r = overdueReport(buyers);
  const { k } = r;
  const topRegion = r.regions[0];
  const longest = r.aging[r.aging.length - 1];
  const topCountries = r.countries.slice(0, TOP_COUNTRIES);
  const restCountries = r.countries.slice(TOP_COUNTRIES);
  const countryMax = topCountries[0]?.amount ?? 0;
  const agingMax = Math.max(0, ...r.aging.map((x) => x.amount));
  const firstBuyers = r.list.slice(0, SHOW_FIRST);
  const moreBuyers = r.list.slice(SHOW_FIRST);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <PageHeader
          title={`연체 바이어 ${int(r.list.length)}곳 · $${int(r.total)}`}
          asof="2026-09-30 · (가상) 합성 데이터"
        />
        <ul className="-mt-3 grid gap-2 text-sm text-ink sm:grid-cols-2">
          <li className="rounded-md border border-sepia bg-parchment px-3 py-2">
            연체는 전체 채권의 <b className="num">{pct(r.shareOfAr)}</b>
          </li>
          <li className="rounded-md border border-sepia bg-parchment px-3 py-2">
            연체의 <b className="num">{pct(r.gradeC.share)}</b>가 C등급 <b className="num">{int(r.gradeC.count)}곳</b>에 몰림
          </li>
          {topRegion ? (
            <li className="rounded-md border border-sepia bg-parchment px-3 py-2">
              가장 큰 지역 <b>{topRegion.region}</b> <Money value={topRegion.amount} rate={rate} className="font-bold" />
            </li>
          ) : null}
          <li className="rounded-md border border-sepia bg-parchment px-3 py-2">
            <b className="num">{longest.min}일</b> 넘게 밀린 곳 <b className="num">{int(longest.count)}곳</b>
          </li>
        </ul>
        <p className="text-xs text-muted">
          괄호 안 원화는 {fxRate.fallback ? "예비 환율(저장본)" : "오늘 환율"} 1달러 ={" "}
          <span className="num">{fx(rate)}원</span>({fxRate.date} · {fxRate.source})로 어림한 참고값입니다 — 결제 · 회계
          기준이 아닙니다.
        </p>
      </div>

      {/* 2 × 2: 윗줄 연체 금액 · 전체 채권, 아랫줄 위험 바이어 · C등급 채권 */}
      <section aria-label="연체 한눈에" className="grid grid-cols-2 gap-3">
        <RingMeter
          title="연체 금액"
          ratio={r.shareOfAr}
          value={<Money value={k.overdue} rate={rate} stack />}
          sub={`${int(k.overdueCount)}곳 · 전체 채권 중`}
          tip={`연체 $${int(k.overdue)} · 전체 채권 $${int(k.arAll)}`}
        />
        <RingMeter
          title="전체 채권"
          ratio={r.aged31Share}
          value={<Money value={k.arAll} rate={rate} stack />}
          sub={
            <>
              빨강: 31일 넘긴 채권 <Money value={r.aged31} rate={rate} />
            </>
          }
          tip={`31일 넘긴 채권 $${int(r.aged31)} · 전체 $${int(k.arAll)}`}
        />
        <RingMeter
          title="위험 바이어(C등급)"
          ratio={k.count > 0 ? k.countC / k.count : null}
          value={<span className="num">{int(k.countC)}곳</span>}
          sub={`전체 ${int(k.count)}곳 중`}
          tip={`C등급 ${int(k.countC)}곳 · 전체 ${int(k.count)}곳`}
        />
        <RingMeter
          title="C등급 채권"
          ratio={k.shareC}
          value={<Money value={k.arC} rate={rate} stack />}
          sub="전체 채권 중"
          tip={`C등급 채권 $${int(k.arC)} · 전체 $${int(k.arAll)}`}
        />
      </section>
      {r.agedUnknown > 0 ? (
        <p className="-mt-6 text-xs text-muted">
          31일 넘긴 비중이 비어 있는 채권 <Money value={r.agedUnknown} rate={rate} />은 빨간 몫에 넣지 않았습니다(확인 필요).
        </p>
      ) : null}

      <section aria-labelledby="where" className="rounded-lg border border-sepia bg-parchment p-4">
        <h2 id="where" className="font-bold text-ink">
          나라별 연체 — 금액 상위 {int(topCountries.length)}개국
        </h2>
        <p className="text-xs text-sepia">나라를 누르면 그 나라의 연체 회사가 펼쳐지고, 회사를 누르면 자세한 내용이 나옵니다.</p>
        <ul className="mt-2 divide-y divide-parchment-deep">
          {topCountries.map((c, i) => (
            <li key={c.country}>
              <details className="group/country">
                <summary className="report-summary flex cursor-pointer list-none items-center gap-2 rounded hover:bg-parchment-deep">
                  <span className="min-w-0 flex-1">
                    <ParchmentBar
                      label={`${i + 1}. ${c.country}`}
                      value={c.amount}
                      max={countryMax}
                      display={<Money value={c.amount} rate={rate} />}
                      sub={`${int(c.count)}곳${c.low > 0 ? ` · 회수 낮음 ${int(c.low)}곳` : ""}`}
                    />
                  </span>
                  <Chevron className="group-open/country:rotate-180" />
                </summary>
                <div className="pb-3 pt-1">
                  <p className="px-1 pb-1 text-xs text-sepia">{c.region}</p>
                  <OverdueListHeader />
                  <ol className="space-y-2">
                    {c.buyers.map((b) => (
                      <li key={b.id}>
                        <OverdueBuyerItem buyer={b} rate={rate} />
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            </li>
          ))}
        </ul>
        {restCountries.length > 0 ? (
          <p className="mt-2 text-xs text-sepia">
            나머지 <span className="num">{int(restCountries.length)}개국</span> ·{" "}
            <span className="num">{int(restCountries.reduce((s, c) => s + c.count, 0))}곳</span> ·{" "}
            <Money value={restCountries.reduce((s, c) => s + c.amount, 0)} rate={rate} />은 아래 전체 목록에 있습니다.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="how-long" className="rounded-lg border border-sepia bg-parchment p-4">
        <h2 id="how-long" className="font-bold text-ink">
          얼마 동안 — 가장 오래 밀린 인보이스 기준
        </h2>
        <p className="text-xs text-sepia">한 바이어의 가장 오래된 미결 인보이스가 며칠째인지로 나눴습니다.</p>
        <div className="mt-2">
          {r.aging.map((g) => (
            <ParchmentBar
              key={g.label}
              label={g.label}
              value={g.amount}
              max={agingMax}
              display={<Money value={g.amount} rate={rate} />}
              sub={`${int(g.count)}곳`}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="who" className="space-y-3">
        <div>
          <h2 id="who" className="text-lg font-bold text-ink">
            연체 바이어 — 금액 큰 순 {int(firstBuyers.length)}곳
          </h2>
          <p className="text-sm text-muted">줄을 누르면 연체 금액 · 기간 · 과거 이력 · 회수 가능성 · 진행 상황 · 최신 동향과 자료 링크가 펼쳐집니다.</p>
        </div>
        <div className="rounded-lg border border-sepia bg-parchment p-3">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {r.recoveryCounts.map((g) => (
              <li key={g.level} className="flex items-center gap-2 text-sm text-ink">
                <RecoveryBadge level={g.level} />
                <span className="num font-semibold">{int(g.count)}곳</span>
                <Money value={g.amount} rate={rate} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-sepia">
            회수 가능성은 데이터에 있는 값이 아니라 규칙으로 매긴 참고 값입니다 — 낮음: {RECOVERY_RULE.lowDays + 1}일 넘게
            밀렸거나 위험 점수 {pct(RECOVERY_RULE.lowScore, 0)} 이상 · 보통: {RECOVERY_RULE.midDays + 1}–{RECOVERY_RULE.lowDays}일
            또는 위험 점수 {pct(RECOVERY_RULE.midScore, 0)}–{pct(RECOVERY_RULE.lowScore, 0)} · 높음: 그 밖. 결정은 사람이 합니다.
          </p>
        </div>
        <OverdueListHeader />
        <ol className="space-y-2">
          {firstBuyers.map((b, i) => (
            <li key={b.id}>
              <OverdueBuyerItem buyer={b} rank={i + 1} rate={rate} />
            </li>
          ))}
        </ol>
        {moreBuyers.length > 0 ? (
          <details className="group/more">
            <summary className="report-summary flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-dashed border-sepia text-sm font-semibold text-sepia hover:bg-parchment">
              나머지 <span className="num">{int(moreBuyers.length)}곳</span> 더 보기
              <Chevron className="group-open/more:rotate-180" />
            </summary>
            <ol className="mt-2 space-y-2">
              {moreBuyers.map((b, i) => (
                <li key={b.id}>
                  <OverdueBuyerItem buyer={b} rank={SHOW_FIRST + i + 1} rate={rate} />
                </li>
              ))}
            </ol>
          </details>
        ) : null}
        <p className="text-sm text-muted">
          신호는 확인해 볼 이유이지, 연체의 원인이라는 뜻은 아닙니다. 진행 상황은 담당자가 기록을 남기면 이 칸에 나옵니다.
        </p>
      </section>
    </div>
  );
}
