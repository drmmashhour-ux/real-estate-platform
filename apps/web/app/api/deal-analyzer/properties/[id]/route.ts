import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { getDealAnalysisPublicDto } from "@/modules/deal-analyzer/application/getDealAnalysis";

export const dynamic = "force-dynamic";

/** GET — latest persisted deal analysis for FSBO listing id (property_id). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDealAnalyzerEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer disabled" }, { status: 503 });
  }

  const { id } = await context.params;
  const userId = await getGuestId();
  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, status: true, moderationStatus: true },
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
  if (!analysis) {
    return NextResponse.json({ analysis: null, needsRun: true });
  }

  return NextResponse.json({ analysis });
}
