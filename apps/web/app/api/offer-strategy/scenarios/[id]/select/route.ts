import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { selectOfferScenario } from "@/src/modules/offer-strategy-simulator/application/selectOfferScenario";
import { selectOfferScenarioBodySchema } from "@/src/modules/offer-strategy-simulator/api/savedScenarioSchemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = selectOfferScenarioBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, caseId } = parsed.data;
  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const out = await selectOfferScenario({
    userId,
    scenarioId: id,
    propertyId,
    caseId,
  });
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 404 });

  captureServerEvent(userId, "offer_strategy_scenario_selected", {
    propertyId,
    caseId: caseId ?? undefined,
    scenarioId: id,
    source: "saved_history",
  });

  return NextResponse.json({ scenario: out.scenario });
}
