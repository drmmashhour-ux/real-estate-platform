import type { DemandForecastInput, DemandForecastOutput } from "../models/index.js";

/**
 * Predict high/low demand periods from region, type, dates, and optional trends.
 */
export function getDemandForecast(input: DemandForecastInput): DemandForecastOutput {
  const from = input.fromDate ? new Date(input.fromDate) : new Date();
  const to = input.toDate
    ? new Date(input.toDate)
    : new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000);

  const highPeriods: DemandForecastOutput["highDemandPeriods"] = [];
  const lowPeriods: DemandForecastOutput["lowDemandPeriods"] = [];

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 7)) {
    const weekStart = d.toISOString().slice(0, 10);
    const weekEnd = new Date(d.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const month = d.getMonth();
    const day = d.getDay();
    if ((month >= 5 && month <= 8) || day === 5 || day === 6) {
      highPeriods.push({ start: weekStart, end: weekEnd, level: 0.8 });
    } else if (month >= 0 && month <= 2 && day >= 1 && day <= 4) {
      lowPeriods.push({ start: weekStart, end: weekEnd, level: 0.3 });
    }
  }

  const bookingTrend = input.bookingHistoryCount ?? 0;
  const level =
    highPeriods.length > lowPeriods.length
      ? "high"
      : input.searchVolumeTrend === "up" || bookingTrend > 20
        ? "medium"
        : "low";

  const summary = `Demand in ${input.region}: ${level}. ${highPeriods.length} high-demand period(s), ${lowPeriods.length} low-demand period(s) identified.`;

  return {
    highDemandPeriods: highPeriods.slice(0, 8),
    lowDemandPeriods: lowPeriods.slice(0, 8),
    demandLevel: level,
    summary,
  };
}
