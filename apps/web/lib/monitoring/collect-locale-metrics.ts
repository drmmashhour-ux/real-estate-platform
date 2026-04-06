import { prisma } from "@/lib/db";
import type { LocaleMetricsSlice, MonitoringLocaleFilter } from "./types";

export async function collectLocaleMetrics(
  start: Date,
  end: Date,
  localeFilter: MonitoringLocaleFilter,
): Promise<LocaleMetricsSlice> {
  const rows =
    localeFilter === "all"
      ? await prisma.$queryRaw<Array<{ loc: string | null; c: bigint }>>`
          SELECT COALESCE(properties->>'locale', 'unknown') AS loc, COUNT(*)::bigint AS c
          FROM growth_funnel_events
          WHERE created_at >= ${start} AND created_at <= ${end}
          GROUP BY 1
          ORDER BY c DESC
        `
      : await prisma.$queryRaw<Array<{ loc: string | null; c: bigint }>>`
          SELECT COALESCE(properties->>'locale', 'unknown') AS loc, COUNT(*)::bigint AS c
          FROM growth_funnel_events
          WHERE created_at >= ${start} AND created_at <= ${end}
            AND (properties->>'locale') = ${localeFilter}
          GROUP BY 1
          ORDER BY c DESC
        `;

  const funnelEventsByLocale: Record<string, number> = {};
  for (const r of rows) {
    funnelEventsByLocale[r.loc ?? "unknown"] = Number(r.c);
  }

  const switchedRows =
    localeFilter === "all"
      ? await prisma.$queryRaw<Array<{ c: bigint }>>`
          SELECT COUNT(*)::bigint AS c
          FROM growth_funnel_events
          WHERE created_at >= ${start} AND created_at <= ${end}
            AND event_name = 'language_switched'
        `
      : await prisma.$queryRaw<Array<{ c: bigint }>>`
          SELECT COUNT(*)::bigint AS c
          FROM growth_funnel_events
          WHERE created_at >= ${start} AND created_at <= ${end}
            AND event_name = 'language_switched'
            AND (properties->>'locale') = ${localeFilter}
        `;

  const languageSwitchedEvents = Number(switchedRows[0]?.c ?? 0);

  return { funnelEventsByLocale, languageSwitchedEvents };
}
