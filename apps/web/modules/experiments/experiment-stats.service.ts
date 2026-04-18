import { prisma } from "@/lib/db";
import { GrowthEventName } from "@/modules/growth/event-types";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

export type VariantCountRow = {
  variant: string;
  pageViews: number;
  conversions: number;
};

/**
 * Aggregate experiment exposure and downstream conversions (signup_success) per variant.
 * Requires events to include metadata.experimentId + metadata.variant (see LP tracking).
 */
export async function getExperimentVariantStats(
  experimentId: string,
  days = 14
): Promise<{ range: { start: string; end: string }; rows: VariantCountRow[] }> {
  const end = addDays(startOfUtcDay(new Date()), 1);
  const start = addDays(end, -Math.max(1, Math.min(90, days)));

  type Raw = { variant: string | null; c: bigint }[];

  const views = await prisma.$queryRaw<Raw>`
    SELECT COALESCE(metadata->>'variant', 'unknown') AS variant, COUNT(*)::bigint AS c
    FROM growth_events
    WHERE created_at >= ${start}
      AND created_at < ${end}
      AND event_name = ${GrowthEventName.PAGE_VIEW}
      AND metadata->>'experimentId' = ${experimentId}
    GROUP BY 1
  `;

  const conv = await prisma.$queryRaw<Raw>`
    SELECT COALESCE(metadata->>'variant', 'unknown') AS variant, COUNT(*)::bigint AS c
    FROM growth_events
    WHERE created_at >= ${start}
      AND created_at < ${end}
      AND event_name = ${GrowthEventName.SIGNUP_SUCCESS}
      AND metadata->>'experimentId' = ${experimentId}
    GROUP BY 1
  `;

  const convMap = new Map(conv.map((r) => [r.variant ?? "unknown", Number(r.c)]));
  const rows: VariantCountRow[] = views.map((v) => ({
    variant: v.variant ?? "unknown",
    pageViews: Number(v.c),
    conversions: convMap.get(v.variant ?? "unknown") ?? 0,
  }));

  return {
    range: { start: start.toISOString(), end: end.toISOString() },
    rows,
  };
}
