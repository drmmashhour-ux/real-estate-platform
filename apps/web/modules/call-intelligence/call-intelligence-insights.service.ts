import type { ScriptConversionStats } from "@/modules/sales-scripts/sales-script.types";

export type IntelPerformanceVm = {
  /** Rolling window */
  sinceDays: number;
  callsPerDayApprox: number;
  successRateApprox: number;
  /** Categories with highest DEMO+CLOSED share */
  topCategories: { category: string; rate: number }[];
};

/**
 * Derive simple KPIs from existing sales-script conversion stats (no PII).
 */
export function buildIntelPerformanceVm(stats: ScriptConversionStats, sinceDays: number): IntelPerformanceVm {
  let totalCalls = 0;
  let wins = 0;

  for (const v of Object.values(stats.byCategory)) {
    totalCalls += v.total;
    wins += (v.byOutcome.DEMO ?? 0) + (v.byOutcome.CLOSED ?? 0);
  }

  const callsPerDayApprox = sinceDays > 0 ? totalCalls / sinceDays : 0;
  const successRateApprox = totalCalls > 0 ? wins / totalCalls : 0;

  const topCategories = Object.entries(stats.byCategory)
    .map(([category, v]) => {
      const good = (v.byOutcome.DEMO ?? 0) + (v.byOutcome.CLOSED ?? 0);
      const rate = v.total > 0 ? good / v.total : 0;
      return { category, rate };
    })
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  return {
    sinceDays,
    callsPerDayApprox: Math.round(callsPerDayApprox * 10) / 10,
    successRateApprox: Math.round(successRateApprox * 1000) / 1000,
    topCategories,
  };
}
