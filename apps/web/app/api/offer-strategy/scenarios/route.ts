import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { trackGrowthFunnelEvent } from "@/src/modules/growth-funnel/application/trackGrowthFunnelEvent";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { saveOfferScenario } from "@/src/modules/offer-strategy-simulator/application/saveOfferScenario";
import { getOfferScenarioHistory } from "@/src/modules/offer-strategy-simulator/application/getOfferScenarioHistory";
import { saveOfferScenarioBodySchema } from "@/src/modules/offer-strategy-simulator/api/savedScenarioSchemas";
import type { OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId") ?? "";
  const caseIdParam = searchParams.get("caseId");
  const caseId = caseIdParam === "" || caseIdParam === null ? null : caseIdParam;

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scenarios = await getOfferScenarioHistory({ userId, propertyId, caseId });
  return NextResponse.json({ scenarios });
}

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = saveOfferScenarioBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, caseId, scenarioLabel, input, output } = parsed.data;
  if (input.propertyId !== propertyId) {
    return NextResponse.json({ error: "input.propertyId must match propertyId" }, { status: 400 });
  }

  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scenario = await saveOfferScenario({
    userId,
    propertyId,
    caseId,
    scenarioLabel,
    input,
    output: output as unknown as OfferSimulationResult,
  });

  captureServerEvent(userId, "offer_strategy_scenario_saved", {
    propertyId,
    caseId: caseId ?? undefined,
    scenarioId: scenario.id,
  });

  await trackGrowthFunnelEvent({
    userId,
    eventName: "scenario_saved",
    properties: { propertyId, scenarioId: scenario.id },
  });

  return NextResponse.json({ scenario });
}
