import { NextRequest, NextResponse } from "next/server";
import { ListingAnalyticsKind } from "@prisma/client";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { listingsDB } from "@/lib/db/listings-client";
import { monolithPrisma } from "@/lib/db/monolith-client";
import {
  incrementFsboContactClick,
  incrementListingShareCount,
  recomputeCrmListingDemandScore,
} from "@/lib/listings/listing-analytics-service";

export const dynamic = "force-dynamic";

type Body = {
  kind?: string;
  listingId?: string;
  event?: string;
};

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`listing-analytics-event:${ip}`, { windowMs: 60_000, max: 90 });
  if (!limit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429, headers: getRateLimitHeaders(limit) });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind.trim().toUpperCase() : "";
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const event = typeof body.event === "string" ? body.event.trim().toLowerCase() : "";

  if (!listingId || !event) {
    return NextResponse.json({ error: "listingId and event required" }, { status: 400 });
  }

  if (kind === "FSBO" && event === "contact_click") {
    const listing = await monolithPrisma.fsboListing.findUnique({ where: { id: listingId } });
    if (!listing || !isFsboPubliclyVisible(listing)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await incrementFsboContactClick(listingId);
    return NextResponse.json({ ok: true });
  }

  if (kind === "CRM" && event === "contact_click") {
    const listing = await listingsDB.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await monolithPrisma.listingAnalytics.upsert({
      where: { kind_listingId: { kind: ListingAnalyticsKind.CRM, listingId } },
      create: { kind: ListingAnalyticsKind.CRM, listingId, contactClicks: 1 },
      update: { contactClicks: { increment: 1 } },
    });
    await recomputeCrmListingDemandScore(listingId);
    return NextResponse.json({ ok: true });
  }

  if (event === "share" && kind === "FSBO") {
    const listing = await monolithPrisma.fsboListing.findUnique({ where: { id: listingId } });
    if (!listing || !isFsboPubliclyVisible(listing)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await incrementListingShareCount(ListingAnalyticsKind.FSBO, listingId);
    return NextResponse.json({ ok: true });
  }

  if (event === "share" && kind === "CRM") {
    const listing = await listingsDB.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await incrementListingShareCount(ListingAnalyticsKind.CRM, listingId);
    await recomputeCrmListingDemandScore(listingId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported kind/event" }, { status: 400 });
}
