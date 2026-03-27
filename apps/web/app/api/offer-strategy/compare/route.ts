import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { compareOfferScenarios } from "@/src/modules/offer-strategy-simulator/application/compareOfferScenarios";
import { compareOfferStrategyBodySchema } from "@/src/modules/offer-strategy-simulator/api/offerStrategySchemas";
import type { LabeledOfferScenario } from "@/src/modules/offer-strategy-simulator/application/compareOfferScenarios";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = compareOfferStrategyBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, scenarios } = parsed.data;
  for (const s of scenarios) {
    if (s.input.propertyId !== propertyId) {
      return NextResponse.json({ error: "Scenario input.propertyId must match propertyId" }, { status: 400 });
    }
  }

  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const labeled = scenarios.map((s) => ({
    id: s.id,
    label: s.label,
    input: s.input,
  })) as [LabeledOfferScenario, LabeledOfferScenario, LabeledOfferScenario];

  const out = await compareOfferScenarios(propertyId, labeled);
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }

  captureServerEvent(userId ?? "anonymous", "offer_strategy_compared", {
    propertyId,
    scenarioIds: scenarios.map((s) => s.id),
    confidence: out.result.confidence,
  });

  return NextResponse.json({ result: out.result });
}
