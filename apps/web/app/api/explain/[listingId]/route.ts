import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { assertListingOwnerOrAdmin } from "@/lib/decision-engine/assertListingOwnerOrAdmin";
import { calculateTrustScore } from "@/modules/trust-score/application/calculateTrustScore";
import { calculateDealScore } from "@/modules/deal-score/application/calculateDealScore";
import { generateExplanation } from "@/modules/ai-explanations/generateExplanation";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";

export const dynamic = "force-dynamic";

/**
 * POST — owner/admin: refresh trust (persist), deterministic deal score (no duplicate `deal_analyses` write),
 * then explanation. Scores are not AI-generated.
 */
export async function POST(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isDealAnalyzerEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer disabled" }, { status: 503 });
  }

  const { listingId } = await context.params;
  const gate = await assertListingOwnerOrAdmin(listingId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const trust = await calculateTrustScore(prisma, listingId);
  if (!trust) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const deal = await calculateDealScore(listingId, { persist: false });
  if (!deal) {
    return NextResponse.json({ error: "Could not compute deal score" }, { status: 503 });
  }

  const explanation = await generateExplanation({ trust, deal });
  return NextResponse.json({ ok: true, trust, deal, explanation });
}
