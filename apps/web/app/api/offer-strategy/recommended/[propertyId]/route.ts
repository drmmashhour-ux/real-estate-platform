import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { getRecommendedOfferScenario } from "@/src/modules/offer-strategy-simulator/application/getRecommendedOfferScenario";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ propertyId: string }> }) {
  const userId = await getGuestId();
  const { propertyId } = await context.params;
  if (!propertyId || typeof propertyId !== "string") {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  }

  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const out = await getRecommendedOfferScenario(propertyId);
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }

  captureServerEvent(userId ?? "anonymous", "offer_strategy_recommended_viewed", {
    propertyId,
    confidence: out.result.confidence,
  });

  return NextResponse.json({ input: out.input, result: out.result });
}
