import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AVM_DISCLAIMER } from "@/lib/valuation/constants";

/**
 * GET /api/valuation/property/:id (id = propertyIdentityId)
 * Returns latest valuations for each type for this property identity.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: propertyIdentityId } = await context.params;
    const valuations = await prisma.propertyValuation.findMany({
      where: { propertyIdentityId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    const byType: Record<string, (typeof valuations)[0]> = {};
    for (const v of valuations) {
      if (!byType[v.valuationType]) byType[v.valuationType] = v;
    }

    return Response.json({
      property_identity_id: propertyIdentityId,
      disclaimer: AVM_DISCLAIMER,
      valuations: Object.entries(byType).map(([type, v]) => ({
        id: v.id,
        valuation_type: type,
        estimated_value: v.estimatedValue,
        value_min: v.valueMin,
        value_max: v.valueMax,
        monthly_rent_estimate: v.monthlyRentEstimate,
        nightly_rate_estimate: v.nightlyRateEstimate,
        annual_revenue_estimate: v.annualRevenueEstimate,
        gross_yield_estimate: v.grossYieldEstimate,
        investment_score: v.investmentScore,
        confidence_score: v.confidenceScore,
        confidence_label: v.confidenceLabel,
        valuation_summary: v.valuationSummary,
        explanation: v.explanation,
        comparables_summary: v.comparablesSummary,
        risk_level: v.riskLevel,
        seasonality_summary: v.seasonalitySummary,
        created_at: v.createdAt,
        updated_at: v.updatedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch valuations" },
      { status: 500 }
    );
  }
}
