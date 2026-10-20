import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GradeBadge from "@/components/GradeBadge";
import PageHeader from "@/components/PageHeader";
import { Chest, HanbitFlag, Skull } from "@/components/TreasureIcons";
import TreasureWorldMap from "@/components/TreasureWorldMap";
import { getBuyers } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";
import { byOverdue, chestCount, MAX_CHESTS, maxOverdue, regionFromSlug, treasureMap } from "@/lib/treasure";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const region = regionFromSlug(slug);
  return { title: region ? `${region} · 보물 지도` : "섬을 찾을 수 없습니다" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const region = regionFromSlug(slug);
  if (!region) notFound();

  const buyers = await getBuyers();
  const { islands } = treasureMap(buyers);
  const island = islands.find((i) => i.region === region);
  if (!island) notFound();

  const inRegion = buyers.filter((b) => b.region === region);
  const list = byOverdue(inRegion.filter((b) => b.overdueUsd > 0));
  const max = maxOverdue(buyers);

  return (
    <div className="space-y-6">
      <PageHeader
        title={region}
        asof="2026-09-30 · (가상) 합성 데이터"
        line={`바이어 ${int(inRegion.length)}곳 중 연체 바이어 ${int(list.length)}곳 — 묻힌 보물(연체)이 많은 순으로 보여 줍니다.`}
      />

      <section aria-label="지역 지도" className="space-y-3">
        <div className="rounded-lg border-4 border-double border-sepia bg-parchment p-1 sm:p-2">
          <TreasureWorldMap regions={islands} focus={island.slug ?? undefined} />
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["채권", usd(island.ar)],
              ["묻힌 보물(연체)", usd(island.overdue)],
              ["C등급 비중", pct(island.shareC)],
              ["바이어", `${int(island.count)}곳`],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-sepia bg-parchment p-3">
              <dt className="text-sm text-sepia">{label}</dt>
              <dd className="num mt-1 font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {island.pirate || island.flag ? (
          <p className="flex items-center gap-2 text-sm font-semibold">
            {island.pirate ? (
              <>
                <Skull className="h-5 w-5" />
                <span className="text-grade-c">해적 바다 — C등급 비중이 전체보다 높은 지역</span>
              </>
            ) : (
              <>
                <HanbitFlag className="h-5 w-4" />
                <span className="text-sepia">한빛 깃발 — 연체 비중이 전체보다 낮은 지역</span>
              </>
            )}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="crew" className="space-y-3">
        <h2 id="crew" className="text-lg font-bold text-ink">
          묻힌 보물이 많은 순
        </h2>
        <p className="text-sm text-muted">
          보물상자는 연체 크기(150곳 중 가장 큰 연체 <span className="num">{usd(max)}</span>가 {MAX_CHESTS}개), 해골은
          C등급 바이어입니다.
        </p>

        {list.length === 0 ? (
          <p className="rounded-lg border border-sepia bg-parchment p-4 text-ink">이 지역에는 연체 바이어가 없습니다.</p>
        ) : null}
        <ol className="space-y-2">
          {list.map((b, i) => {
            const chests = chestCount(b.overdueUsd, max);
            return (
              <li key={b.id} className="rounded-lg border border-sepia bg-parchment p-3">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0">
                    <Link
                      href={`/buyers/${b.id}`}
                      className="flex min-h-11 items-center gap-1 font-semibold text-ink underline decoration-sepia underline-offset-4"
                    >
                      {b.grade === "C" ? <Skull className="h-6 w-6 shrink-0" /> : null}
                      {i + 1}. {b.name}
                    </Link>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-sepia">
                      <span className="num">{b.id}</span>
                      <span>{b.countryKo}</span>
                      <span className="inline-flex rounded bg-bg">
                        <GradeBadge grade={b.grade} />
                      </span>
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    {chests > 0 ? (
                      <div className="flex justify-end gap-0.5">
                        {Array.from({ length: chests }, (_, k) => (
                          <Chest key={k} className="h-6 w-6" />
                        ))}
                        <span className="sr-only">보물상자 {chests}개</span>
                      </div>
                    ) : null}
                    <p className="text-sm">
                      <span className="text-sepia">묻힌 보물(연체) </span>
                      <span className="num font-semibold text-ink">{usd(b.overdueUsd)}</span>
                    </p>
                    <p className="text-xs text-sepia">
                      채권 <span className="num">{usd(b.openArUsd)}</span>
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-muted">
          연체가 없는 바이어 <span className="num">{int(inRegion.length - list.length)}곳</span>은{" "}
          <Link href="/buyers" className="text-accent underline">
            바이어 목록
          </Link>
          에서 볼 수 있습니다. 해골과 보물상자는 확인해 볼 이유이지, 연체의 원인이라는 뜻은 아닙니다.
        </p>
      </section>

      <Link href="/regions" className="inline-flex min-h-11 items-center rounded-md border border-sepia px-4 text-sepia">
        보물 지도로
      </Link>
    </div>
  );
}
