import { prisma } from "@/lib/db";
import { getPlatformStatsForDateRange, getPlatformStatsForDayCount, startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";
import type { PlatformStatsResult } from "@/modules/analytics/services/get-platform-stats";

export type TimeseriesBundle = {
  platform: PlatformStatsResult;
  source: "rollup" | "calendar_range";
};

/** Rolling N UTC days ending today */
export async function getPlatformTimeseriesDays(days: number): Promise<TimeseriesBundle> {
  const d = Math.min(366, Math.max(1, Math.floor(days)));
  const platform = await getPlatformStatsForDayCount(d);
  return { platform, source: "rollup" };
}

/** Inclusive `from` / exclusive `to` as YYYY-MM-DD UTC */
export async function getPlatformTimeseriesRange(fromIsoDate: string, toIsoDateExclusive: string): Promise<TimeseriesBundle> {
  const platform = await getPlatformStatsForDateRange(fromIsoDate, toIsoDateExclusive);
  return { platform, source: "calendar_range" };
}

export function daysBetween(from: Date, toExclusive: Date): number {
  return Math.max(1, Math.round((toExclusive.getTime() - from.getTime()) / 86_400_000));
}

export function defaultRangeFromPreset(preset: "7d" | "30d" | "90d"): { from: Date; toExclusive: Date } {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = new Date(todayStart);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const toExclusive = new Date(todayStart);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  return { from, toExclusive };
}

/** Previous period of same length immediately before `from` */
export function previousPeriod(from: Date, toExclusive: Date): { from: Date; toExclusive: Date } {
  const len = toExclusive.getTime() - from.getTime();
  const prevTo = new Date(from.getTime());
  const prevFrom = new Date(from.getTime() - len);
  return { from: prevFrom, toExclusive: prevTo };
}
