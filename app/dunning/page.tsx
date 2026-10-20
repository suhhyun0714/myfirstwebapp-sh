import Link from "next/link";
import DecideForm from "@/components/DecideForm";
import GradeBadge from "@/components/GradeBadge";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import { db } from "@/lib/db";
import { int, kst, usd } from "@/lib/format";
import { readChecks } from "@/lib/guardrails";

export const dynamic = "force-dynamic";
export const metadata = { title: "독촉 승인" };

// 승인 대기열 — AI가 쓴 독촉 초안을 사람이 승인 · 반려한다. 승인해도 메일은 나가지 않는다.
const TABS = [
  { key: "pending", label: "대기" },
  { key: "approved", label: "승인" },
  { key: "rejected", label: "반려" },
  { key: "blocked", label: "막힘" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab: raw } = await searchParams;
  const tab: Tab = TABS.find((t) => t.key === raw)?.key ?? "pending";

  const [groups, drafts] = await Promise.all([
    db().dunningDraft.groupBy({ by: ["status"], _count: { _all: true } }),
    db().dunningDraft.findMany({
      where: { status: tab },
      orderBy: [{ overdueUsd: "desc" }, { buyerId: "asc" }],
      include: { buyer: { select: { name: true, grade: true } } },
    }),
  ]);
  const countOf = (key: string) => groups.find((g) => g.status === key)?._count._all ?? 0;
  const total = groups.reduce((s, g) => s + g._count._all, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="독촉 승인"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="AI(claude -p)가 미리 쓴 독촉 메일 초안입니다. 코드가 G1–G7로 채점했고, 대기 초안만 승인 · 반려할 수 있습니다."
      />
      <Notice tone="info" title="AI는 초안까지만 — 승인해도 메일은 나가지 않습니다(실제 발송 없음)" />

      <nav aria-label="초안 상태">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <li key={t.key}>
                <Link
                  href={{ pathname: "/dunning", query: { tab: t.key } }}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-3 font-semibold ${
                    active ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-surface"
                  }`}
                >
                  {t.label} <span className="num">{int(countOf(t.key))}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {drafts.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-muted">
          {total === 0
            ? "아직 초안이 없습니다 — 터미널에서 npm run drafts를 돌리면 초안이 생깁니다."
            : "이 칸에 들어 있는 초안이 없습니다."}
        </p>
      ) : (
        <ol className="space-y-4">
          {drafts.map((d) => {
            const checks = readChecks(d.checks);
            const failed = checks.filter((c) => !c.ok);
            return (
              <li key={d.id} className="space-y-3 rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/buyers/${d.buyerId}`}
                    className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
                  >
                    {d.buyerId} · {d.buyer.name}
                  </Link>
                  <GradeBadge grade={d.buyer.grade} />
                  <span className="text-sm text-ink">
                    <span className="num">{d.stage}</span> · <span className="num">{d.tone}</span>
                  </span>
                  <span className="ml-auto text-sm text-muted">
                    연체 <span className="num font-semibold text-ink">{usd(d.overdueUsd)}</span>
                  </span>
                </div>

                <div className="rounded-md bg-surface p-3">
                  <p className="font-semibold text-ink">{d.subject}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink">{d.body}</p>
                </div>

                <p className="text-sm text-ink">
                  <span className="mr-2 text-muted">요약</span>
                  {d.summaryKo}
                </p>

                <ul aria-label="검사 7칸" className="grid gap-1 text-sm sm:grid-cols-2">
                  {checks.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="num text-muted">{c.id}</span>
                      <span className="text-ink">{c.label}</span>
                      <span
                        className={`rounded border px-1.5 text-xs font-semibold ${
                          c.ok ? "border-grade-s text-grade-s" : "border-warn text-warn"
                        }`}
                      >
                        {c.ok ? "통과" : "걸림"}
                      </span>
                      {!c.ok && c.note ? <span className="break-words text-warn">{c.note}</span> : null}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-muted">
                  만든 시각 <span className="num">{kst(d.createdAt)}</span> · 초안 <span className="num">#{d.id}</span>
                </p>

                {d.status === "pending" ? <DecideForm draftId={d.id} /> : null}
                {d.status === "approved" ? (
                  <p className="rounded-md border-l-4 border-grade-s bg-surface p-3 text-sm text-ink">
                    <b>발송 대기 — 실제 발송 없음</b> · {d.decidedBy ?? "확인 필요"} ·{" "}
                    <span className="num">{d.decidedAt ? kst(d.decidedAt) : "확인 필요"}</span>
                  </p>
                ) : null}
                {d.status === "rejected" ? (
                  <p className="rounded-md border-l-4 border-warn bg-surface p-3 text-sm text-ink">
                    <b>반려</b> · 사유: {d.reason ?? "확인 필요"} · {d.decidedBy ?? "확인 필요"} ·{" "}
                    <span className="num">{d.decidedAt ? kst(d.decidedAt) : "확인 필요"}</span>
                  </p>
                ) : null}
                {d.status === "blocked" ? (
                  <p className="rounded-md border-l-4 border-warn bg-surface p-3 text-sm text-ink">
                    <b>막힘 — 승인할 수 없습니다</b> · 걸린 검사:{" "}
                    {failed.length ? failed.map((c) => `${c.id} ${c.label}`).join(" · ") : "확인 필요"}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
