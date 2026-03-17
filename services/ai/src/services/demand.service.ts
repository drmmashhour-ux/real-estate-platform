import type { DemandInput, DemandOutput } from "../models/index.js";

/**
 * Demand forecasting from region and optional filters.
 * Stub: returns rule-based high/low dates; can be wired to search volume and booking frequency data.
 */
export function getDemandForecast(input: DemandInput): DemandOutput {
  const from = input.fromDate ? new Date(input.fromDate) : new Date();
  const to = input.toDate ? new Date(input.toDate) : new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000);
  const highDemandDates: string[] = [];
  const lowDemandDates: string[] = [];
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    const month = d.getMonth();
    const iso = d.toISOString().slice(0, 10);
    if (month >= 5 && month <= 8 || (day === 5 || day === 6)) {
      highDemandDates.push(iso);
    } else if (month >= 0 && month <= 2 && day >= 1 && day <= 4) {
      lowDemandDates.push(iso);
    }
  }
  return {
    demandLevel: highDemandDates.length > lowDemandDates.length ? "high" : "medium",
    highDemandDates: highDemandDates.slice(0, 14),
    lowDemandDates: lowDemandDates.slice(0, 14),
    searchVolumeTrend: "stable",
    bookingFrequencyTrend: "stable",
  };
}
