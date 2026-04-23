import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { assertListingOwnerOrAdmin } from "@/lib/decision-engine/assertListingOwnerOrAdmin";
import { runDecisionEngine } from "@/modules/decision-engine/application/runDecisionEngine";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";

export const dynamic = "force-dynamic";

/** POST — owner/admin: trust + persisted deal analysis + explanation (deterministic scores; AI optional for summary). */
export async function POST(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isDealAnalyzerEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer disabled" }, { status: 503 });
  }

  const { listingId } = await context.params;
  const gate = await assertListingOwnerOrAdmin(listingId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const result = await runDecisionEngine(prisma, listingId);
  if (!result) {
    return NextResponse.json({ error: "Could not run decision engine" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, ...result });
}
