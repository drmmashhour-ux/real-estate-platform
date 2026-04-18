import { prisma } from "@/lib/db";
import { startOfWeek, subWeeks } from "date-fns";

export type WeeklyCohortRow = {
  weekStart: string;
  signups: number;
  /** Users with `updatedAt` > createdAt + 24h (weak “returned” proxy). */
  returnedWithinWindow: number;
};

/**
 * Weekly signup cohorts with a simple post-signup activity proxy (not formal retention science).
 */
export async function buildWeeklySignupCohorts(weeks = 12): Promise<{
  generatedAt: string;
  rows: WeeklyCohortRow[];
  disclaimers: string[];
}> {
  const now = new Date();
  const oldest = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), weeks - 1);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: oldest } },
    select: { createdAt: true, updatedAt: true },
  });

  const bucket = new Map<string, { signups: number; returned: number }>();

  for (const u of users) {
    const ws = startOfWeek(u.createdAt, { weekStartsOn: 1 });
    const key = ws.toISOString().slice(0, 10);
    const cur = bucket.get(key) ?? { signups: 0, returned: 0 };
    cur.signups += 1;
    if (u.updatedAt.getTime() - u.createdAt.getTime() > 86_400_000) cur.returned += 1;
    bucket.set(key, cur);
  }

  const rows: WeeklyCohortRow[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const d = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), w);
    const key = startOfWeek(d, { weekStartsOn: 1 }).toISOString().slice(0, 10);
    const r = bucket.get(key);
    rows.push({
      weekStart: key,
      signups: r?.signups ?? 0,
      returnedWithinWindow: r?.returned ?? 0,
    });
  }

  return {
    generatedAt: now.toISOString(),
    rows,
    disclaimers: [
      "`returnedWithinWindow` uses profile `updatedAt` — can include passive saves, not proof of value.",
    ],
  };
}
