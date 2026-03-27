import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { simulateFutureOutcome } from "@/src/modules/future-outcome-simulator/application/simulateFutureOutcome";
import { futureOutcomeBodySchema } from "@/src/modules/future-outcome-simulator/api/futureOutcomeSchemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = futureOutcomeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId } = parsed.data;
  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = simulateFutureOutcome({
    propertyId: parsed.data.propertyId,
    listPriceCents: parsed.data.listPriceCents,
    scenarioInput: parsed.data.scenarioInput,
    simulationResult: parsed.data.simulationResult,
    caseState: parsed.data.caseState ?? null,
    dealSignals: parsed.data.dealSignals ?? null,
  });

  return NextResponse.json({ result });
}
