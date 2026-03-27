import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { isDealAnalyzerBnhubModeEnabled, isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { getDealAnalysisPublicDto } from "@/modules/deal-analyzer/application/getDealAnalysis";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerBnhubModeEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer BNHub mode disabled" }, { status: 503 });
  }

  const { id } = await context.params;
  const userId = await getGuestId();
  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, status: true, moderationStatus: true, listingDealType: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = Boolean(userId && listing.ownerId === userId);
  const isAdmin = await isPlatformAdmin(userId);
  const publicOk = isFsboPubliclyVisible(listing);
  if (!isOwner && !isAdmin && !publicOk) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const analysis = await getDealAnalysisPublicDto(id);
  const bnhub = analysis?.phase2?.bnhub ?? null;

  return NextResponse.json({
    applicable: Boolean(bnhub),
    listingDealType: listing.listingDealType,
    bnhub,
    message: bnhub
      ? null
      : "No BNHub overlay on file. Run Phase 2 with a short-term listing id to attach BNHub metrics.",
  });
}
