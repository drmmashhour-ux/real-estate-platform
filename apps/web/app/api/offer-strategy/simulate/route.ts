import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { prisma } from "@/lib/db";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { checkGrowthPaywall } from "@/src/modules/growth-funnel/application/checkGrowthPaywall";
import { recordSuccessfulSimulatorRun } from "@/src/modules/growth-funnel/application/recordSuccessfulSimulatorRun";
import { simulateOfferStrategy } from "@/src/modules/offer-strategy-simulator/application/simulateOfferStrategy";
import { simulateOfferStrategyBodySchema } from "@/src/modules/offer-strategy-simulator/api/offerStrategySchemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = simulateOfferStrategyBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId } = parsed.data;
  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, role: true },
    });
    if (u) {
      const paywall = await checkGrowthPaywall({
        userId,
        plan: u.plan,
        role: u.role,
        kind: "simulator",
      });
      if (!paywall.allowed) {
        return NextResponse.json(
          { error: "SIMULATOR_LIMIT", remaining: paywall.remaining, limit: paywall.limit },
          { status: 403 },
        );
      }
    }
  }

  const out = await simulateOfferStrategy(parsed.data);
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }

  captureServerEvent(userId ?? "anonymous", "offer_strategy_simulated", {
    propertyId,
    confidence: out.result.confidence,
  });

  if (userId) {
    await recordSuccessfulSimulatorRun({
      userId,
      propertyId,
      source: "offer_strategy_simulate",
    });
  }

  return NextResponse.json({ result: out.result });
}
