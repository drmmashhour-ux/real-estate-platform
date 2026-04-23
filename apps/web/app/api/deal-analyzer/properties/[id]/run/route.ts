import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { runDealAnalysis } from "@/modules/deal-analyzer/application/runDealAnalysis";
import { getDealAnalysisPublicDto } from "@/modules/deal-analyzer/application/getDealAnalysis";

export const dynamic = "force-dynamic";

/** POST — owner/admin: recompute and persist deal analysis. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer disabled" }, { status: 503 });
  }

  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await isPlatformAdmin(userId);
  if (listing.ownerId !== userId && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const out = await runDealAnalysis({ listingId: id });
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: out.error === "Listing not found" ? 404 : 503 });
  }

  const analysis = await getDealAnalysisPublicDto(id);
  return NextResponse.json({ ok: true, analysisId: out.analysisId, analysis });
}
