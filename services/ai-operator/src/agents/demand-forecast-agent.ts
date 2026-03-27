import type { DemandForecastInput, DemandForecastOutput } from "../models/agents.js";

export function runDemandForecastAgent(input: DemandForecastInput): DemandForecastOutput {
  const from = input.fromDate ? new Date(input.fromDate) : new Date();
  const to = input.toDate
    ? new Date(input.toDate)
    : new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000);
  const highDemandDates: string[] = [];
  const lowDemandDates: string[] = [];

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const month = d.getMonth();
    const day = d.getDay();
    if ((month >= 5 && month <= 8) || day === 5 || day === 6) highDemandDates.push(iso);
    else if (month <= 2 && day >= 1 && day <= 4) lowDemandDates.push(iso);
  }

  const bookingFreq = input.bookingFrequency ?? 0;
  const searchUp = input.searchVolumeTrend === "up";
  const demandLevel: DemandForecastOutput["demandLevel"] =
    highDemandDates.length > lowDemandDates.length && (bookingFreq > 10 || searchUp)
      ? "high"
      : bookingFreq > 5 || searchUp
        ? "medium"
        : "low";

  const supplyShortageSignals: string[] = [];
  if (demandLevel === "high") supplyShortageSignals.push("High demand in " + input.market);
  const pricingPressureIndicators: string[] = [];
  if (demandLevel === "high") pricingPressureIndicators.push("Consider dynamic pricing for peak dates");

  return {
    demandLevel,
    highDemandDates: highDemandDates.slice(0, 14),
    lowDemandDates: lowDemandDates.slice(0, 14),
    supplyShortageSignals,
    pricingPressureIndicators,
    confidenceScore: 0.75,
    recommendedAction: "set_demand_forecast",
    reasonCodes: [`market:${input.market}`, `level:${demandLevel}`],
    escalateToHuman: false,
  };
}
