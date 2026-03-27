import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { compareSavedOfferScenarios } from "@/src/modules/offer-strategy-simulator/application/compareSavedOfferScenarios";
import { compareSavedScenariosBodySchema } from "@/src/modules/offer-strategy-simulator/api/savedScenarioSchemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = compareSavedScenariosBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, idA, idB } = parsed.data;
  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const out = await compareSavedOfferScenarios({ userId, propertyId, idA, idB });
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });

  captureServerEvent(userId, "offer_strategy_saved_scenarios_compared", {
    propertyId,
    idA,
    idB,
  });

  return NextResponse.json({ comparison: out.comparison });
}
