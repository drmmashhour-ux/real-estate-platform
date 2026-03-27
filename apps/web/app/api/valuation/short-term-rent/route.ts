import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { buildPropertyInput } from "@/lib/valuation/input";
import { checkValuationGuardrails } from "@/lib/valuation/guardrails";
import { computeShortTermRentValuation } from "@/lib/valuation/short-term-rent";
import { saveValuation } from "@/lib/valuation/store";

/**
 * POST /api/valuation/short-term-rent
 * Body: property_identity_id, listing_id?
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const propertyIdentityId = body.property_identity_id as string;
    const listingId = body.listing_id as string | undefined;

    if (!propertyIdentityId) {
      return Response.json({ error: "property_identity_id is required" }, { status: 400 });
    }

    const guardrails = await checkValuationGuardrails(propertyIdentityId);
    if (!guardrails.allowed) {
      return Response.json({ error: "Valuation not allowed", warnings: guardrails.warnings }, { status: 403 });
    }

    const input = await buildPropertyInput(propertyIdentityId, listingId);
    if (!input) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    const result = await computeShortTermRentValuation(input, listingId ?? undefined);
    const valuationId = await saveValuation(propertyIdentityId, listingId ?? null, "short_term_rental", result);

    return Response.json({
      valuation_id: valuationId,
      disclaimer: guardrails.disclaimer,
      warnings: guardrails.warnings,
      result: {
        valuation_type: "short_term_rental",
        recommended_nightly_rate_cents: result.recommendedNightlyRateCents,
        expected_monthly_occupancy_percent: result.expectedMonthlyOccupancyPercent,
        expected_monthly_revenue_cents: result.expectedMonthlyRevenueCents,
        expected_annual_revenue_cents: result.expectedAnnualRevenueCents,
        high_season_nightly_cents: result.highSeasonNightlyCents,
        low_season_nightly_cents: result.lowSeasonNightlyCents,
        confidence_score: result.confidenceScore,
        confidence_label: result.confidenceLabel,
        seasonality_summary: result.seasonalitySummary,
        explanation: result.explanation,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Valuation failed" },
      { status: 500 }
    );
  }
}
