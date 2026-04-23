import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";
import { addPropertyToWatchlist } from "@/modules/deal-analyzer/infrastructure/services/watchlistService";
import { assertFsboListingAccessibleForPhase3 } from "@/lib/deal-analyzer/phase3ListingAccess";
import { addWatchlistItemBodySchema } from "@/modules/deal-analyzer/api/phase3Schemas";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerAlertsEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer alerts disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: watchlistId } = await context.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = addWatchlistItemBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const propertyId = parsed.data.propertyId;
  const gate = await assertFsboListingAccessibleForPhase3(propertyId, userId);
  if (!gate.ok) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const row = await addPropertyToWatchlist({ watchlistId, userId, propertyId });
  if (!row) return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });

  const analysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
  });
  if (analysis) {
    await prisma.dealWatchlistItem.update({
      where: { id: row.id },
      data: {
        lastInvestmentScore: analysis.investmentScore,
        lastRiskScore: analysis.riskScore,
        lastOpportunityType: analysis.opportunityType,
      },
    });
  }

  return NextResponse.json({ ok: true, itemId: row.id });
}
