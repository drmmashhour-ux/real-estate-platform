import { NextResponse } from "next/server";
import { assertListingOwnerOrAdmin } from "@/lib/decision-engine/assertListingOwnerOrAdmin";
import { calculateFraudScore } from "@/modules/fraud-risk/application/calculateFraudScore";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST — owner/admin: deterministic fraud/risk snapshot.
 * Does not return raw signal details (internal review use); only safe summary fields.
 */
export async function POST(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const gate = await assertListingOwnerOrAdmin(listingId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const result = await calculateFraudScore(prisma, listingId);
  if (!result) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    fraudRiskLevel: result.riskLevel,
    reviewRecommended: result.reviewRecommended,
    message:
      result.reviewRecommended === true
        ? "Automated checks recommend a manual review before major actions."
        : "Automated checks completed with no mandatory escalation.",
  });
}
