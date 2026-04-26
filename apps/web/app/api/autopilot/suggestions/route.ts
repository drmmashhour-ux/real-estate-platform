import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { intelligenceFlags } from "@/config/feature-flags";
import { isReasonableListingId } from "@/lib/api/safe-params";

export const dynamic = "force-dynamic";

/**
 * GET /api/autopilot/suggestions?listingId= — listing owner reads pending explainable suggestions.
 */
export async function GET(req: Request) {
  if (!intelligenceFlags.autopilotV2) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listingId = new URL(req.url).searchParams.get("listingId")?.trim() ?? "";
  if (!listingId || !isReasonableListingId(listingId)) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await prisma.autopilotV2Suggestion.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      confidence: true,
      impactEstimate: true,
      status: true,
      explanation: true,
      suggestedChange: true,
      autoApplicable: true,
      trigger: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    suggestions: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      impactLabel: impactTierLabel(r.impactEstimate),
      confidenceLabel: confidenceTierLabel(r.confidence),
    })),
  });
}

function impactTierLabel(impact: number): "small" | "moderate" | "meaningful" {
  if (!Number.isFinite(impact)) return "small";
  if (impact < 0.08) return "small";
  if (impact < 0.15) return "moderate";
  return "meaningful";
}

function confidenceTierLabel(c: number): "low" | "medium" | "higher" {
  if (!Number.isFinite(c)) return "low";
  if (c < 0.45) return "low";
  if (c < 0.58) return "medium";
  return "higher";
}
