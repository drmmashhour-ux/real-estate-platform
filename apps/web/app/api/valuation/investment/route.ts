import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { buildPropertyInput } from "@/lib/valuation/input";
import { checkValuationGuardrails } from "@/lib/valuation/guardrails";
import { computeInvestmentValuation } from "@/lib/valuation/investment";
import { saveValuation } from "@/lib/valuation/store";
import { investmentFeaturesOr403 } from "@/lib/compliance/investment-api-guard";

/**
 * POST /api/valuation/investment
 * Body: property_identity_id, listing_id?
 */
export async function POST(request: NextRequest) {
  try {
    const blocked = await investmentFeaturesOr403();
    if (blocked) return blocked;

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

    const result = await computeInvestmentValuation(input);
    const valuationId = await saveValuation(propertyIdentityId, listingId ?? null, "investment", result);

    return Response.json({
      valuation_id: valuationId,
      disclaimer: guardrails.disclaimer,
      warnings: guardrails.warnings,
      result: {
        valuation_type: "investment",
        investment_score: result.investmentScore,
        risk_level: result.riskLevel,
        gross_yield_estimate_percent: result.grossYieldEstimatePercent,
        simple_roi_indicator: result.simpleRoiIndicator,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        summary_insight: result.summaryInsight,
        confidence_score: result.confidenceScore,
        confidence_label: result.confidenceLabel,
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
