import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { assertListingOwnerOrAdmin } from "@/lib/decision-engine/assertListingOwnerOrAdmin";
import { calculateTrustScore } from "@/modules/trust-score/application/calculateTrustScore";

export const dynamic = "force-dynamic";

/** POST — owner/admin: recompute trust score and persist verification case + signals. */
export async function POST(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const gate = await assertListingOwnerOrAdmin(listingId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const trust = await calculateTrustScore(prisma, listingId);
  if (!trust) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, trust });
}
