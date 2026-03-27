import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isDealAnalyzerMortgageModeEnabled } from "@/modules/deal-analyzer/config";
import { analyzeMortgageAffordability } from "@/modules/deal-analyzer/infrastructure/services/mortgageAffordabilityService";
import { logDealAnalyzerPhase3 } from "@/modules/deal-analyzer/infrastructure/services/phase3Logger";

export async function runMortgageAffordabilityAnalysis(args: {
  listingId: string;
  downPaymentCents?: number | null;
  annualRate?: number | null;
  termYears?: number | null;
  monthlyIncomeCents?: number | null;
  monthlyDebtsCents?: number | null;
}) {
  if (!isDealAnalyzerMortgageModeEnabled()) {
    return { ok: false as const, error: "Mortgage affordability mode is disabled" };
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    select: { priceCents: true },
  });
  if (!listing) return { ok: false as const, error: "Listing not found" };

  const out = analyzeMortgageAffordability({
    listPriceCents: listing.priceCents,
    downPaymentCents: args.downPaymentCents ?? null,
    annualRate: args.annualRate ?? null,
    termYears: args.termYears ?? null,
    monthlyIncomeCents: args.monthlyIncomeCents ?? null,
    monthlyDebtsCents: args.monthlyDebtsCents ?? null,
  });

  const row = await prisma.dealAffordabilityAnalysis.create({
    data: {
      propertyId: args.listingId,
      downPaymentCents: args.downPaymentCents ?? null,
      interestRate: args.annualRate != null ? new Prisma.Decimal(args.annualRate.toFixed(6)) : null,
      amortizationYears: args.termYears ?? null,
      monthlyIncomeCents: args.monthlyIncomeCents ?? null,
      monthlyDebtsCents: args.monthlyDebtsCents ?? null,
      estimatedMonthlyPaymentCents: out.estimatedMonthlyPaymentCents,
      affordabilityLevel: out.affordabilityLevel,
      affordabilityRatio:
        out.affordabilityRatio != null ? new Prisma.Decimal(out.affordabilityRatio.toFixed(4)) : null,
      confidenceLevel: out.confidenceLevel,
      warnings: out.warnings as Prisma.InputJsonValue,
      explanation: out.explanation,
    },
  });

  logDealAnalyzerPhase3("deal_analyzer_affordability", {
    propertyId: args.listingId,
    level: out.affordabilityLevel,
    confidence: out.confidenceLevel,
    trigger: "runMortgageAffordabilityAnalysis",
  });

  return { ok: true as const, id: row.id, result: out };
}
