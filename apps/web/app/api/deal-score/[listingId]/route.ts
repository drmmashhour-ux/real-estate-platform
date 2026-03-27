import { NextResponse } from "next/server";
import { assertListingOwnerOrAdmin } from "@/lib/decision-engine/assertListingOwnerOrAdmin";
import { calculateDealScore } from "@/modules/deal-score/application/calculateDealScore";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";

export const dynamic = "force-dynamic";

/** POST — owner/admin: run deal analyzer and persist `deal_analyses`. */
export async function POST(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isDealAnalyzerEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer disabled" }, { status: 503 });
  }

  const { listingId } = await context.params;
  const gate = await assertListingOwnerOrAdmin(listingId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const deal = await calculateDealScore(listingId, { persist: true });
  if (!deal) {
    return NextResponse.json({ error: "Could not compute deal score" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, deal });
}
