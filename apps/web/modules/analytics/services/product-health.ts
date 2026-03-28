import { UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_DAYS = 30;

export type ProductHealthResult = {
  days: number;
  /** Distinct sessionIds in window (approx. “users”) */
  approxUsers: number;
  counts: Record<UserEventType, number>;
  showSaveHint: boolean;
  highlightCompare: boolean;
};

function countsFromRows(rows: { eventType: UserEventType; _count: number }[]): Record<UserEventType, number> {
  const out = {} as Record<UserEventType, number>;
  for (const t of Object.values(UserEventType)) {
    out[t] = 0;
  }
  for (const r of rows) {
    out[r.eventType] = r._count;
  }
  return out;
}

export async function getProductHealth(days = DEFAULT_DAYS): Promise<ProductHealthResult> {
  const since = new Date(Date.now() - days * 86_400_000);

  const [grouped, sessionGroups] = await Promise.all([
    prisma.userEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.userEvent.groupBy({
      by: ["sessionId"],
      where: {
        createdAt: { gte: since },
        sessionId: { not: null },
      },
      _count: true,
    }),
  ]);

  const counts = countsFromRows(grouped.map((g) => ({ eventType: g.eventType, _count: g._count })));
  const analyze = counts[UserEventType.ANALYZE];
  const save = counts[UserEventType.SAVE_DEAL];
  const compare = counts[UserEventType.COMPARE];

  const showSaveHint = analyze >= 5 && save / Math.max(analyze, 1) < 0.25;
  const highlightCompare = analyze >= 5 && compare < 3;

  return {
    days,
    approxUsers: sessionGroups.length,
    counts,
    showSaveHint,
    highlightCompare,
  };
}
