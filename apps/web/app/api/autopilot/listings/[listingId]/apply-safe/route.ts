import { NextResponse } from "next/server";
import { applySafeFixesForListing } from "@/lib/autopilot/apply-safe-fixes";
import { requireListingOwnerOrAdmin } from "@/lib/autopilot/listing-guard";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await ctx.params;
  const gate = await requireListingOwnerOrAdmin(listingId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const result = await applySafeFixesForListing({
    listingId,
    performedByUserId: gate.userId,
  });
  return NextResponse.json(result);
}
