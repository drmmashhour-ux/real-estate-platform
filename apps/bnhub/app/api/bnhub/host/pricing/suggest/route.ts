import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { bnhubV2Flags, revenueV4Flags } from "@/config/feature-flags";
import { buildBnhubPricingSuggestion } from "@/modules/bnhub-pricing/pricing-engine.service";
import { computeBnhubAdvisoryPricing } from "@/modules/bnhub/pricing/bnhub-dynamic-pricing.service";
import { logBnhubEngineDecision } from "@/modules/bnhub-analytics/bnhub-v2-audit.service";

export const dynamic = "force-dynamic";

/** POST — pricing suggestion only; does not change listing price. */
export async function POST(request: NextRequest) {
  const pricingGate =
    bnhubV2Flags.bnhubV2 &&
    (bnhubV2Flags.bnhubPricingEngineV1 || revenueV4Flags.bnhubDynamicPricingV1);
  if (!pricingGate) {
    return NextResponse.json({ error: "BNHub pricing intelligence disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  let listingId = "";
  let checkIn: string | undefined;
  try {
    const body = (await request.json()) as { listingId?: string; checkIn?: string };
    listingId = typeof body.listingId === "string" ? body.listingId : "";
    checkIn = typeof body.checkIn === "string" ? body.checkIn : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestion = bnhubV2Flags.bnhubPricingEngineV1
    ? await buildBnhubPricingSuggestion(listingId, checkIn)
    : null;
  const advisory = revenueV4Flags.bnhubDynamicPricingV1 ? await computeBnhubAdvisoryPricing(listingId) : null;

  await logBnhubEngineDecision({
    listingId,
    hostUserId: userId,
    decisionType: "pricing_suggestion_requested",
    source: "api.bnhub.host.pricing.suggest",
    payload: { checkIn: checkIn ?? null, advisory: advisory != null },
  });

  return NextResponse.json({ suggestion, advisory });
}
