import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Chest, HanbitFlag, PirateShip, Skull } from "@/components/TreasureIcons";
import TreasureWorldMap from "@/components/TreasureWorldMap";
import { getBuyers } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";
import { MAX_CHESTS, treasureMap } from "@/lib/treasure";

export const metadata = { title: "보물 지도" };

export default async function Page() {
  const buyers = await getBuyers();
  const { islands, shareCAll, overdueShareAll } = treasureMap(buyers);

  return (
    <div className="space-y-6">
      <PageHeader
        title="한빛정밀의 숨어있는 돈을 찾아서"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="바이어가 있는 땅 6곳을 누르면 그 지역의 연체 바이어가 묻힌 보물이 많은 순으로 나옵니다."
      />

      <section aria-label="보물 지도" className="rounded-lg border-4 border-double border-sepia bg-parchment p-1 sm:p-2">
        <TreasureWorldMap regions={islands} />
      </section>

      <section aria-labelledby="legend" className="rounded-lg border border-sepia bg-parchment p-3">
        <h2 id="legend" className="text-sm font-bold text-sepia">
          지도 읽는 법
        </h2>
        <ul className="mt-2 grid gap-2 text-sm text-ink sm:grid-cols-2">
          <li className="flex items-center gap-2">
            <Chest className="h-6 w-6 shrink-0" />
            <span>보물상자 — 채권이 클수록 많이(가장 큰 지역 {MAX_CHESTS}개)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex shrink-0 items-center">
              <Skull className="h-6 w-6" />
              <PirateShip className="h-6 w-7" />
            </span>
            <span>
              해골 · 해적선 — C등급 비중이 전체(<span className="num">{pct(shareCAll)}</span>)보다 높은 지역
            </span>
          </li>
          <li className="flex items-center gap-2">
            <HanbitFlag className="h-7 w-6 shrink-0" />
            <span>
              한빛 깃발 — 연체 비중이 전체(<span className="num">{pct(overdueShareAll)}</span>)보다 낮은 지역
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-4 w-6 shrink-0 rounded-sm border border-dashed border-sepia bg-parchment" />
            <span>점선 땅 — 바이어가 없는 곳(누르지 않음)</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="regions" className="space-y-2">
        <h2 id="regions" className="text-lg font-bold text-ink">
          지역 6곳
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {islands.map((r) =>
            r.slug ? (
              <li key={r.region}>
                <Link
                  href={`/regions/${r.slug}`}
                  className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-sepia bg-parchment px-3 py-2 hover:bg-parchment-deep"
                >
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold text-ink underline decoration-sepia underline-offset-4">
                      {r.region}
                    </span>
                    {r.pirate ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-grade-c">
                        <Skull className="h-5 w-5" />
                        해적 바다
                      </span>
                    ) : null}
                    {r.flag ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-sepia">
                        <HanbitFlag className="h-5 w-4" />
                        한빛 깃발
                      </span>
                    ) : null}
                  </span>
                  <span className="text-right text-sm">
                    <span className="text-sepia">묻힌 보물(연체) </span>
                    <span className="num font-semibold text-ink">{usd(r.overdue)}</span>
                    <span className="block text-xs text-sepia">
                      연체 바이어 <span className="num">{int(r.overdueCount)}곳</span> · 채권{" "}
                      <span className="num">{usd(r.ar)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      </section>

      <p className="text-sm text-muted">보물 · 해골 · 깃발은 판단을 돕는 그림이고, 결정은 사람이 합니다.</p>
    </div>
  );
}
