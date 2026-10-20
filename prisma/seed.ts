import "dotenv/config";
import buyers from "../data/buyers.json";
import { db } from "../lib/db";

// 처음 데이터 — data/buyers.json의 바이어를 Buyer 표에 넣는다. 두 번 넣어도 이미 있는 id는 건너뛴다.
async function main() {
  const data = buyers.map((b) => ({
    id: b.id,
    name: b.name,
    countryCode: b.countryCode,
    countryKo: b.countryKo,
    region: b.region,
    industry: b.industry,
    paymentMethod: b.paymentMethod,
    termsDays: b.termsDays,
    openArUsd: b.openArUsd,
    overdueUsd: b.overdueUsd,
    pctAr31p: b.pctAr31p,
    oldestOpenDays: b.oldestOpenDays,
    avgDaysLate12m: b.avgDaysLate12m,
    pd30d: b.pd30d,
    grade: b.grade,
    signals: b.signals,
  }));

  const { count: added } = await db().buyer.createMany({ data, skipDuplicates: true });

  // 넣은 뒤 DB에서 다시 센다
  const total = await db().buyer.count();
  const groups = await db().buyer.groupBy({ by: ["grade"], _count: { _all: true } });
  const byGrade = (g: string) => groups.find((x) => x.grade === g)?._count._all ?? 0;
  const reviews = await db().review.count();

  console.log(`새로 넣음 ${added}행 · 이미 있던 행 ${buyers.length - added}행`);
  console.log(`Buyer ${total}행 (S ${byGrade("S")} · A ${byGrade("A")} · B ${byGrade("B")} · C ${byGrade("C")})`);
  console.log(`Review ${reviews}행`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db().$disconnect();
  });
