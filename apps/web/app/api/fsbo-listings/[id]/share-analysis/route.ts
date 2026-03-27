import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { signListingAnalysisShare } from "@/lib/share/listing-analysis-share";

export const dynamic = "force-dynamic";

/** POST — owner-only; returns shareable URL (sanitized public page). */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id: listingId } = await context.params;

  const listing = await prisma.fsboListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const exp = Math.floor(Date.now() / 1000) + 30 * 86400;
  const token = signListingAnalysisShare({ listingId, ownerId: userId, exp });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const url = `${origin}/share/analysis?t=${encodeURIComponent(token)}`;

  captureServerEvent(userId, "listing_analysis_share_created", { listingId });

  return NextResponse.json({ url, expiresAt: new Date(exp * 1000).toISOString() });
}
