import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/db";

type SubjectAgg = { subjectType: string; subjectId: string; revenueCents: number; spendCents: number };

function rollup(rows: { subjectType: string | null; subjectId: string | null; amountCents: number | null; eventKey: string }[]): SubjectAgg[] {
  const map = new Map<string, SubjectAgg>();
  for (const r of rows) {
    if (!r.subjectType || !r.subjectId) continue;
    const k = `${r.subjectType}:${r.subjectId}`;
    const cur = map.get(k) ?? {
      subjectType: r.subjectType,
      subjectId: r.subjectId,
      revenueCents: 0,
      spendCents: 0,
    };
    const amt = r.amountCents ?? 0;
    if (r.eventKey === "revenue" && amt > 0) cur.revenueCents += amt;
    if (r.eventKey === "spend" && amt > 0) cur.spendCents += amt;
    map.set(k, cur);
  }
  return [...map.values()];
}

export async function aggregateSubjectRoi(userId: string, since: Date) {
  const rows = await prisma.marketingSystemEvent.findMany({
    where: {
      userId,
      category: MarketingSystemEventCategory.PERFORMANCE,
      createdAt: { gte: since },
      subjectType: { not: null },
      subjectId: { not: null },
    },
    select: { subjectType: true, subjectId: true, amountCents: true, eventKey: true },
    take: 5000,
  });
  const agg = rollup(rows as { subjectType: string | null; subjectId: string | null; amountCents: number | null; eventKey: string }[]);
  const withRoi = agg
    .map((a) => ({
      ...a,
      roiPercent:
        a.spendCents > 0 ? Math.round(((a.revenueCents - a.spendCents) / a.spendCents) * 1000) / 10 : null,
    }))
    .filter((a) => a.revenueCents > 0 || a.spendCents > 0);

  const top = [...withRoi].sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 8);
  const worst = [...withRoi]
    .filter((a) => a.spendCents > 0 && (a.roiPercent == null || a.roiPercent < 0))
    .sort((a, b) => (a.roiPercent ?? 0) - (b.roiPercent ?? 0))
    .slice(0, 8);

  return { subjects: withRoi, topPerforming: top, worstPerforming: worst };
}
