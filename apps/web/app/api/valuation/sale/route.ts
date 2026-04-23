import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { buildPropertyInput } from "@/lib/valuation/input";
import { checkValuationGuardrails } from "@/lib/valuation/guardrails";
import { computeSaleValuation } from "@/lib/valuation/sale";
import { saveValuation } from "@/lib/valuation/store";

/**
 * POST /api/valuation/sale
 * Body: property_identity_id, listing_id? (optional, for current listing price)
 * Returns sale valuation and saves to property_valuations.
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

    const { prisma } = await import("@repo/db");
    const listingPrice = listingId
      ? (await prisma.shortTermListing.findUnique({ where: { id: listingId }, select: { nightPriceCents: true } }))?.nightPriceCents
      : null;
    const result = await computeSaleValuation(input, listingPrice ?? undefined);

    const valuationId = await saveValuation(propertyIdentityId, listingId ?? null, "sale", result);

    return Response.json({
      valuation_id: valuationId,
      disclaimer: guardrails.disclaimer,
      warnings: guardrails.warnings,
      result: {
        valuation_type: "sale",
        estimated_value_cents: result.estimatedValueCents,
        value_min_cents: result.valueMinCents,
        value_max_cents: result.valueMaxCents,
        confidence_score: result.confidenceScore,
        confidence_label: result.confidenceLabel,
        position_label: result.positionLabel,
        explanation: result.explanation,
        comparables_summary: { count: result.comparables.length, reasons: result.comparables.map((c) => c.reason) },
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
