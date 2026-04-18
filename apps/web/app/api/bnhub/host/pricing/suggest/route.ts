import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { bnhubV2Flags } from "@/config/feature-flags";
import { buildBnhubPricingSuggestion } from "@/modules/bnhub-pricing/pricing-engine.service";
import { logBnhubEngineDecision } from "@/modules/bnhub-analytics/bnhub-v2-audit.service";

export const dynamic = "force-dynamic";

/** POST — pricing suggestion only; does not change listing price. */
export async function POST(request: NextRequest) {
  if (!bnhubV2Flags.bnhubV2 || !bnhubV2Flags.bnhubPricingEngineV1) {
    return NextResponse.json({ error: "BNHub pricing engine disabled" }, { status: 403 });
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

  const suggestion = await buildBnhubPricingSuggestion(listingId, checkIn);
  await logBnhubEngineDecision({
    listingId,
    hostUserId: userId,
    decisionType: "pricing_suggestion_requested",
    source: "api.bnhub.host.pricing.suggest",
    payload: { checkIn: checkIn ?? null },
  });

  return NextResponse.json({ suggestion });
}
