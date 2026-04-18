import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { intelligenceFlags } from "@/config/feature-flags";
import { runAutopilotV2ForListing } from "@/src/modules/autopilot/v2/autopilot.engine";
import { prisma } from "@/lib/db";
import { isReasonableListingId } from "@/lib/api/safe-params";
import { logIntelligenceEvent } from "@/src/modules/events/event.logger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  listingId: z.string().trim().min(8).max(64),
  trigger: z.string().max(64).optional(),
});

/**
 * POST /api/autopilot/run — owner runs explainable autopilot v2 for an FSBO listing.
 */
export async function POST(req: Request) {
  if (!intelligenceFlags.autopilotV2) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { listingId } = parsed.data;
  if (!isReasonableListingId(listingId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await runAutopilotV2ForListing({
    listingId,
    eventHint: parsed.data.trigger ?? "listing_updated",
  });

  void logIntelligenceEvent({
    type: "autopilot_action_executed",
    userId,
    listingId,
    payload: { created: result.created, skippedReason: result.skippedReason },
  });

  return NextResponse.json({ ok: true, ...result });
}
