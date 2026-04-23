import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { getGuestId } from "@/lib/auth/session";
import { getDefaultTenantId } from "@/lib/buyer/tenant-context";
import { recordBuyerGrowthEvent } from "@/lib/buyer/buyer-analytics";
import { refreshFsboListingAnalytics } from "@/lib/listings/listing-analytics-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`buyer:listing-view:${ip}`, { windowMs: 60_000, max: 120 });
  if (!limit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429, headers: getRateLimitHeaders(limit) });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fsboListingId = typeof o.fsboListingId === "string" ? o.fsboListingId.trim() : "";
  const sessionId = typeof o.sessionId === "string" ? o.sessionId.slice(0, 64) : null;
  if (!fsboListingId) return NextResponse.json({ error: "fsboListingId required" }, { status: 400 });

  const listing = await prisma.fsboListing.findUnique({ where: { id: fsboListingId } });
  if (!listing || !isFsboPubliclyVisible(listing)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  const tenantId = await getDefaultTenantId();

  await prisma.buyerListingView.create({
    data: {
      fsboListingId,
      userId: userId ?? undefined,
      sessionId: sessionId ?? undefined,
      tenantId: tenantId ?? undefined,
    },
  });

  void recordBuyerGrowthEvent("LISTING_VIEW", fsboListingId, {
    userId: userId ?? undefined,
    sessionId: sessionId ?? undefined,
  });

  void refreshFsboListingAnalytics(fsboListingId, listing.priceCents).catch(() => {});

  return NextResponse.json({ ok: true });
}
