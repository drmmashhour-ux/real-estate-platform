import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isDealAnalyzerBnhubModeEnabled, isDealAnalyzerScenariosEnabled } from "@/modules/deal-analyzer/config";
import { buildDealAnalyzerListingInput } from "@/modules/deal-analyzer/infrastructure/services/listingInputBuilder";
import {
  buildBnhubScenarios,
  buildRentalScenarios,
} from "@/modules/deal-analyzer/infrastructure/services/scenarioSimulationService";
import { ScenarioMode } from "@/modules/deal-analyzer/domain/scenarios";
import type { BnhubScenarioMetrics, RentalScenarioMetrics } from "@/modules/deal-analyzer/domain/scenarios";
import { logDealAnalyzerPhase2 } from "@/modules/deal-analyzer/infrastructure/services/phase2Logger";

export async function runScenarioSimulation(args: {
  listingId: string;
  analysisId?: string;
  financing?: { loanPrincipalCents: number | null; annualRate?: number; termYears?: number } | null;
  /** When set and BNHUB mode is enabled, appends short-term scenarios (persisted alongside rental). */
  shortTermListingId?: string | null;
}) {
  if (!isDealAnalyzerScenariosEnabled()) {
    return { ok: false as const, error: "Scenario simulation is disabled" };
  }

  const analysis =
    args.analysisId != null
      ? await prisma.dealAnalysis.findUnique({ where: { id: args.analysisId } })
      : await prisma.dealAnalysis.findFirst({
          where: { propertyId: args.listingId },
          orderBy: { createdAt: "desc" },
        });

  if (!analysis?.id) {
    return { ok: false as const, error: "No deal analysis found — run Phase 1 first." };
  }

  const input = await buildDealAnalyzerListingInput(args.listingId);
  if (!input) {
    return { ok: false as const, error: "Listing not found" };
  }

  let rows: Array<RentalScenarioMetrics | BnhubScenarioMetrics> = buildRentalScenarios({
    input,
    financing: args.financing ?? null,
  });

  if (isDealAnalyzerBnhubModeEnabled() && args.shortTermListingId?.trim()) {
    const st = await prisma.shortTermListing.findUnique({
      where: { id: args.shortTermListingId.trim() },
      select: { nightPriceCents: true, cleaningFeeCents: true },
    });
    if (st) {
      rows = [...rows, ...buildBnhubScenarios({ nightPriceCents: st.nightPriceCents, cleaningFeeCents: st.cleaningFeeCents })];
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.dealAnalysisScenario.deleteMany({ where: { analysisId: analysis.id } });

    for (const r of rows) {
      if (r.scenarioMode === ScenarioMode.RENTAL) {
        await tx.dealAnalysisScenario.create({
          data: {
            analysisId: analysis.id,
            scenarioType: r.scenarioType,
            scenarioMode: ScenarioMode.RENTAL,
            monthlyRent: r.monthlyRentCents,
            occupancyRate:
              r.occupancyRate != null ? new Prisma.Decimal(r.occupancyRate.toFixed(4)) : null,
            operatingCost: r.operatingCostCents,
            mortgageCost: r.mortgageCostCents,
            monthlyCashFlow: r.monthlyCashFlowCents,
            annualRoi: r.annualRoi != null ? new Prisma.Decimal(r.annualRoi.toFixed(4)) : null,
            capRate: r.capRate != null ? new Prisma.Decimal(r.capRate.toFixed(4)) : null,
            details: {
              warnings: r.warnings,
              mortgageUnavailableReason: r.mortgageUnavailableReason,
              confidenceLevel: r.confidenceLevel,
            } as object,
          },
        });
      } else {
        await tx.dealAnalysisScenario.create({
          data: {
            analysisId: analysis.id,
            scenarioType: r.scenarioType,
            scenarioMode: ScenarioMode.BNHUB,
            monthlyRent: null,
            occupancyRate:
              r.occupancyRate != null ? new Prisma.Decimal(r.occupancyRate.toFixed(4)) : null,
            operatingCost: (r.platformFeeCents ?? 0) + (r.cleaningCostCents ?? 0),
            mortgageCost: null,
            monthlyCashFlow: r.monthlyNetOperatingCents,
            annualRoi: null,
            capRate: null,
            details: {
              scenarioMode: ScenarioMode.BNHUB,
              warnings: r.warnings,
              confidenceLevel: r.confidenceLevel,
              nightlyRateCents: r.nightlyRateCents,
              platformFeeCents: r.platformFeeCents,
              cleaningCostCents: r.cleaningCostCents,
              monthlyGrossRevenueCents: r.monthlyGrossRevenueCents,
              monthlyNetOperatingCents: r.monthlyNetOperatingCents,
            } as object,
          },
        });
      }
    }

    const prev =
      analysis.summary && typeof analysis.summary === "object"
        ? (analysis.summary as Record<string, unknown>)
        : {};
    const phase2 = typeof prev.phase2 === "object" && prev.phase2 != null ? { ...(prev.phase2 as object) } : {};

    const rentalOnly = rows.filter((x): x is RentalScenarioMetrics => x.scenarioMode === ScenarioMode.RENTAL);
    const bnhubCount = rows.filter((x) => x.scenarioMode === ScenarioMode.BNHUB).length;
    const confRental =
      rentalOnly.length === 0
        ? "low"
        : rentalOnly.every((x) => x.confidenceLevel === "low")
          ? "low"
          : rentalOnly.some((x) => x.confidenceLevel === "low")
            ? "medium"
            : "high";

    await tx.dealAnalysis.update({
      where: { id: analysis.id },
      data: {
        summary: {
          ...prev,
          phase2: {
            ...phase2,
            scenarioSummary: {
              mode: bnhubCount > 0 ? "mixed" : ScenarioMode.RENTAL,
              modes: bnhubCount > 0 ? [ScenarioMode.RENTAL, ScenarioMode.BNHUB] : [ScenarioMode.RENTAL],
              scenarioCount: rows.length,
              confidence: confRental,
            },
          },
        } as object,
      },
    });
  });

  logDealAnalyzerPhase2("deal_analyzer_scenario_run", {
    listingId: args.listingId,
    analysisId: analysis.id,
    scenarioCount: String(rows.length),
    trigger: "runScenarioSimulation",
  });

  return { ok: true as const, analysisId: analysis.id, scenarios: rows };
}
