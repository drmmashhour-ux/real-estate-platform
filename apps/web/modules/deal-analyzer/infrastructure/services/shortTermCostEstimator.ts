import { dealAnalyzerConfig } from "@/config/dealAnalyzer";

/** Rules-based monthly cleaning / turnover load — not from reservation data. */
export function estimateMonthlyShortTermOverheadCents(args: {
  grossMonthlyRevenueCents: number;
  cleaningFeeCentsPerEvent: number;
}): { cleaningCents: number; turnoverCents: number; totalCents: number } {
  const events = dealAnalyzerConfig.bnhub.assumedCleaningEventsPerMonth;
  const cleaningCents = Math.round(args.cleaningFeeCentsPerEvent * events);
  const turnoverCents = Math.round(args.grossMonthlyRevenueCents * dealAnalyzerConfig.bnhub.turnoverCostPct);
  return {
    cleaningCents,
    turnoverCents,
    totalCents: cleaningCents + turnoverCents,
  };
}
