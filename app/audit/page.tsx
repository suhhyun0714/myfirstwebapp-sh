import Link from "next/link";
import DataTable from "@/components/DataTable";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import { db } from "@/lib/db";
import { int, kst } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "감사 기록" };

// 감사 기록 — 쌓기만 한다. 이 쪽은 읽기만 하고, AuditLog는 어디서도 create 말고는 쓰지 않는다.
const ACTIONS = ["초안 작성", "초안 막힘", "승인", "반려"] as const;
const LIMIT = 50;

export default async function Page({ searchParams }: { searchParams: Promise<{ action?: string | string[] }> }) {
  const { action: raw } = await searchParams;
  const action = ACTIONS.find((a) => a === raw);
  const where = action ? { action } : {};

  const [groups, rows] = await Promise.all([
    db().auditLog.groupBy({ by: ["action"], _count: { _all: true } }),
    db().auditLog.findMany({ where, orderBy: [{ at: "desc" }, { id: "desc" }], take: LIMIT }),
  ]);
  const countOf = (a: string) => groups.find((g) => g.action === a)?._count._all ?? 0;
  const all = groups.reduce((s, g) => s + g._count._all, 0);
  const shown = action ? countOf(action) : all;

  const filters = [{ key: undefined, label: "전체", count: all }, ...ACTIONS.map((a) => ({ key: a, label: a, count: countOf(a) }))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="감사 기록"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="초안 작성 · 막힘 · 승인 · 반려가 일어날 때마다 누가 · 언제 · 무엇을 했는지 한 줄씩 쌓입니다."
      />
      <Notice tone="info" title="이 기록은 지우거나 고치지 않습니다" />

      <nav aria-label="기록 거르기">
        <ul className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = f.key === action;
            return (
              <li key={f.label}>
                <Link
                  href={f.key ? { pathname: "/audit", query: { action: f.key } } : "/audit"}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-3 font-semibold ${
                    active ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-surface"
                  }`}
                >
                  {f.label} <span className="num">{int(f.count)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="text-sm text-muted">
        모두 <span className="num">{int(shown)}줄</span> · 최근 <span className="num">{LIMIT}줄</span>까지 · 최신이 맨 위
      </p>

      <DataTable
        caption={action ? `감사 기록 — ${action}` : "감사 기록 — 전체"}
        empty="아직 쌓인 기록이 없습니다."
        columns={[
          { key: "at", label: "시각" },
          { key: "actor", label: "누가" },
          { key: "action", label: "무엇을" },
          { key: "target", label: "대상" },
          { key: "detail", label: "내용" },
        ]}
        rows={rows.map((r) => ({
          at: <span className="num">{kst(r.at, true)}</span>,
          actor: r.actor,
          action: r.action,
          target: r.target,
          detail: <span className="break-words">{r.detail}</span>,
        }))}
      />
    </div>
  );
}
