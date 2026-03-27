import { NextRequest, NextResponse } from "next/server";
import { analyzeDeal, type DealAnalyzerInput } from "@/lib/ai/deal-analyzer";
import { getGuestId } from "@/lib/auth/session";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

export const dynamic = "force-dynamic";

function num(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/**
 * POST — rule-based deal analysis (estimate). Not financial or legal advice.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const purchasePrice = num(body.purchasePrice, NaN);
  if (!(purchasePrice > 0)) {
    return NextResponse.json({ error: "purchasePrice must be a positive number" }, { status: 400 });
  }

  const input: DealAnalyzerInput = {
    purchasePrice,
    rentEstimate: num(body.rentEstimate, Math.round(purchasePrice * 0.004)),
    propertyTaxAnnual: num(body.propertyTaxAnnual, purchasePrice * 0.012),
    condoFeesAnnual: num(body.condoFeesAnnual, 0),
    insuranceAnnual: num(body.insuranceAnnual, 1200),
    managementAnnual: num(body.managementAnnual, 0),
    repairsReserveAnnual: num(body.repairsReserveAnnual, purchasePrice * 0.01),
    otherAnnualExpenses: num(body.otherAnnualExpenses, 0),
    otherMonthlyExpenses: num(body.otherMonthlyExpenses, 0),
    interestRate: num(body.interestRate, 5.49),
    downPayment: num(body.downPayment, purchasePrice * 0.2),
    amortizationYears: Math.max(1, Math.round(num(body.amortizationYears, 25))),
    vacancyRatePercent: num(body.vacancyRatePercent, 5),
    closingCosts: num(body.closingCosts, 7500),
    welcomeTax: num(body.welcomeTax, 0),
    locationCity: typeof body.locationCity === "string" ? body.locationCity : "—",
    propertyType: typeof body.propertyType === "string" ? body.propertyType : "Property",
    mode: body.mode === "buyer" ? "buyer" : "investor",
    buyerFeatureScore:
      body.buyerFeatureScore != null ? Math.min(1, Math.max(0, num(body.buyerFeatureScore, 0.5))) : undefined,
    thresholds:
      body.thresholds && typeof body.thresholds === "object" && body.thresholds !== null
        ? (body.thresholds as DealAnalyzerInput["thresholds"])
        : undefined,
  };

  const result = analyzeDeal(input);

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : undefined;
  const uid = await getGuestId();
  if (uid) {
    captureServerEvent(uid, AnalyticsEvents.DEAL_ANALYSIS_RUN, {
      listingId: listingId ?? null,
      score: result.dealScore,
      recommendation: result.classificationLabel,
    });
  }

  return NextResponse.json({
    ok: true,
    analysis: result,
    label: "estimate",
  });
}
