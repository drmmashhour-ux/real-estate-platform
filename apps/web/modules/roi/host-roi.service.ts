/**
 * Host-side ROI — re-exports the existing calculator used by `/api/roi/calculate`.
 * @see roi-calculator.service.ts
 */
import { buildRoiComparison } from "./roi-calculator.service";
import type { RoiCalculatorInput, RoiComparisonResult } from "./roi-calculator.types";

export {
  buildRoiComparison,
  calculateCurrentGrossRevenueCents,
  calculateCompetitorNetRevenueCents,
} from "./roi-calculator.service";
export type { RoiCalculatorInput, RoiComparisonResult } from "./roi-calculator.types";

/** Compact summary for APIs — still includes full `detail` for transparency. */
export function summarizeHostRoiForApi(input: RoiCalculatorInput):
  | {
      monthlyRevenue: number;
      yearlyRevenue: number;
      net: number;
      comparisonNote: string;
      disclaimer: "Estimate only";
      detail: RoiComparisonResult;
    }
  | { error: string } {
  const r = buildRoiComparison(input);
  if ("error" in r) return r;
  const yearlyRevenue = r.lecipm.optimizedGrossRevenueCents / 100;
  return {
    monthlyRevenue: yearlyRevenue / 12,
    yearlyRevenue,
    net: r.lecipm.netRevenueCents / 100,
    comparisonNote: `Modeled vs declared competitor fee on same gross — ${r.currentPlatform.platformName ?? "other platform"}.`,
    disclaimer: "Estimate only",
    detail: r,
  };
}
