import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { computeIncomeComponent } from "@/modules/deal-analyzer/domain/scoring";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";
import {
  ScenarioKind,
  ScenarioMode,
  type BnhubScenarioMetrics,
  type RentalScenarioMetrics,
} from "@/modules/deal-analyzer/domain/scenarios";
import { occupancyForBnhubScenario } from "@/modules/deal-analyzer/infrastructure/services/occupancyAssumptionService";
import { estimateMonthlyShortTermOverheadCents } from "@/modules/deal-analyzer/infrastructure/services/shortTermCostEstimator";
import { estimateMonthlyOperatingCostCents } from "@/modules/deal-analyzer/infrastructure/services/operatingCostEstimator";
import {
  defaultFinancingParams,
  estimateMonthlyMortgagePaymentCents,
} from "@/modules/deal-analyzer/infrastructure/services/financingScenarioService";

function scenarioKindList(): (typeof ScenarioKind)[keyof typeof ScenarioKind][] {
  return [ScenarioKind.CONSERVATIVE, ScenarioKind.EXPECTED, ScenarioKind.AGGRESSIVE];
}

export function buildRentalScenarios(args: {
  input: DealAnalyzerListingInput;
  financing?: { loanPrincipalCents: number | null; annualRate?: number; termYears?: number } | null;
}): RentalScenarioMetrics[] {
  const cfg = dealAnalyzerConfig.scenario.rental;
  const priceUsd = args.input.priceCents / 100;
  const hasIncomeDim = computeIncomeComponent(args.input) != null;
  const minSq = cfg.minSqftForRentScenario;
  const minBeds = cfg.minBedsForRentScenario;
  const weakRent =
    !hasIncomeDim ||
    (args.input.surfaceSqft != null && args.input.surfaceSqft < minSq) ||
    (args.input.bedrooms ?? 0) < minBeds;

  const baseRent = Math.round(priceUsd * cfg.priceToMonthlyRentFactor * 100);

  const fin = args.financing?.loanPrincipalCents != null ? args.financing : null;
  const fp = defaultFinancingParams();
  const apr = fin?.annualRate ?? fp.apr;
  const years = fin?.termYears ?? fp.termYears;
  const mortgageUnavailableReason =
    fin == null || fin.loanPrincipalCents == null
      ? "Mortgage inputs not provided — showing unstressed cash flow only."
      : null;

  const out: RentalScenarioMetrics[] = [];

  for (const kind of scenarioKindList()) {
    const mult =
      kind === ScenarioKind.CONSERVATIVE
        ? cfg.conservativeRentMultiplier
        : kind === ScenarioKind.EXPECTED
          ? cfg.expectedRentMultiplier
          : cfg.aggressiveRentMultiplier;

    const occ =
      kind === ScenarioKind.CONSERVATIVE
        ? cfg.conservativeOccupancy
        : kind === ScenarioKind.EXPECTED
          ? cfg.expectedOccupancy
          : cfg.aggressiveOccupancy;

    const monthlyRentCents = weakRent ? null : Math.round(baseRent * mult);
    const effectiveRentCents =
      monthlyRentCents != null ? Math.round(monthlyRentCents * occ) : null;

    const operatingCostCents =
      effectiveRentCents != null ? estimateMonthlyOperatingCostCents(effectiveRentCents, kind) : null;

    let mortgageCostCents: number | null = null;
    if (fin?.loanPrincipalCents != null && fin.loanPrincipalCents > 0) {
      mortgageCostCents = estimateMonthlyMortgagePaymentCents({
        loanPrincipalCents: fin.loanPrincipalCents,
        annualRate: apr,
        termYears: years,
      });
    }

    const monthlyCashFlowCents =
      effectiveRentCents != null && operatingCostCents != null
        ? effectiveRentCents - operatingCostCents - (mortgageCostCents ?? 0)
        : null;

    const annualRoi =
      monthlyCashFlowCents != null && priceUsd > 0
        ? (((monthlyCashFlowCents / 100) * 12) / priceUsd) * 100
        : null;

    const capRate =
      effectiveRentCents != null && operatingCostCents != null && priceUsd > 0
        ? ((((effectiveRentCents - operatingCostCents) / 100) * 12) / priceUsd) * 100
        : null;

    const warnings: string[] = [];
    if (weakRent) {
      warnings.push(
        "Rental scenario metrics omitted or de-emphasized — insufficient structured rental signals for this listing.",
      );
    } else {
      warnings.push(
        "Rent figures are illustrative rules-based estimates from list price — not a rent survey or appraisal.",
      );
    }

    out.push({
      scenarioType: kind,
      scenarioMode: ScenarioMode.RENTAL,
      monthlyRentCents: effectiveRentCents,
      occupancyRate: occ,
      operatingCostCents,
      mortgageCostCents,
      monthlyCashFlowCents,
      annualRoi,
      capRate,
      confidenceLevel: weakRent ? "low" : kind === ScenarioKind.CONSERVATIVE ? "medium" : "medium",
      warnings,
      mortgageUnavailableReason,
    });
  }

  return out;
}

/** Three BNHub short-term scenarios (conservative / expected / aggressive) — illustrative, not booking data. */
export function buildBnhubScenarios(args: { nightPriceCents: number; cleaningFeeCents: number }): BnhubScenarioMetrics[] {
  const cfg = dealAnalyzerConfig.bnhub;
  const weak = args.nightPriceCents <= 0;
  const out: BnhubScenarioMetrics[] = [];

  for (const kind of scenarioKindList()) {
    const occ = occupancyForBnhubScenario(kind);
    const monthlyNights = 30 * occ;
    const gross = Math.round(args.nightPriceCents * monthlyNights);
    const platformFeeCents = Math.round(gross * cfg.platformFeePct);
    const overhead = estimateMonthlyShortTermOverheadCents({
      grossMonthlyRevenueCents: gross,
      cleaningFeeCentsPerEvent: args.cleaningFeeCents,
    });
    const net = gross - platformFeeCents - overhead.totalCents;

    const warnings: string[] = weak
      ? ["Nightly rate missing or invalid — short-term scenario metrics are not meaningful."]
      : [
          "Illustrative occupancy and platform fee — not a booking forecast or income guarantee.",
        ];

    out.push({
      scenarioType: kind,
      scenarioMode: ScenarioMode.BNHUB,
      nightlyRateCents: weak ? null : args.nightPriceCents,
      occupancyRate: occ,
      platformFeeCents,
      cleaningCostCents: overhead.cleaningCents,
      monthlyGrossRevenueCents: weak ? null : gross,
      monthlyNetOperatingCents: weak ? null : net,
      confidenceLevel: weak ? "low" : "medium",
      warnings,
    });
  }

  return out;
}
