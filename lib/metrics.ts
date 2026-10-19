import type { Buyer, Grade } from "@/lib/buyers";

// 계산만 한다(순수 함수 · 화면 글자 없음). 등급은 grade 칸 그대로 — pd30d로 다시 매기지 않는다.
// 나누는 값이 0이면 비율은 null(화면에서 "—").

export const GRADES: Grade[] = ["S", "A", "B", "C"];

const sum = (buyers: Buyer[], pick: (b: Buyer) => number) => buyers.reduce((s, b) => s + pick(b), 0);
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

export function kpis(buyers: Buyer[]) {
  const gradeC = buyers.filter((b) => b.grade === "C");
  const arAll = sum(buyers, (b) => b.openArUsd);
  const arC = sum(gradeC, (b) => b.openArUsd);
  return {
    countC: gradeC.length,
    arC,
    shareC: ratio(arC, arAll),
    arAll,
    count: buyers.length,
    overdue: sum(buyers, (b) => b.overdueUsd),
    overdueCount: buyers.filter((b) => b.overdueUsd > 0).length,
  };
}

/** S · A · B · C 순서의 곳 수 */
export function gradeCounts(buyers: Buyer[]): { grade: Grade; count: number }[] {
  return GRADES.map((grade) => ({ grade, count: buyers.filter((b) => b.grade === grade).length }));
}

/** pd30d 큰 순, 같으면 id 순 */
function byRisk(a: Buyer, b: Buyer) {
  if (b.pd30d !== a.pd30d) return b.pd30d - a.pd30d;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function topRisk(buyers: Buyer[], n = 10): Buyer[] {
  return [...buyers].sort(byRisk).slice(0, n);
}

/** 지역마다 곳 수 · 채권 합 · C등급 채권 합 · C 몫(그 지역 C 합 ÷ 그 지역 합), 합이 큰 순 */
export function byRegion(buyers: Buyer[]) {
  const map = new Map<string, Buyer[]>();
  for (const b of buyers) map.set(b.region, [...(map.get(b.region) ?? []), b]);
  return [...map.entries()]
    .map(([region, list]) => {
      const ar = sum(list, (b) => b.openArUsd);
      const arC = sum(
        list.filter((b) => b.grade === "C"),
        (b) => b.openArUsd,
      );
      return { region, count: list.length, ar, arC, shareC: ratio(arC, ar) };
    })
    .sort((a, b) => b.ar - a.ar);
}

export function isGrade(v: unknown): v is Grade {
  return typeof v === "string" && (GRADES as string[]).includes(v);
}

/** grade가 S · A · B · C면 그 등급만, 아니면 전부. 순서는 topRisk와 같다. */
export function filterByGrade(buyers: Buyer[], grade?: string | null): Buyer[] {
  const list = isGrade(grade) ? buyers.filter((b) => b.grade === grade) : buyers;
  return [...list].sort(byRisk);
}
