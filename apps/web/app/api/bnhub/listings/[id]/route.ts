import { NextRequest, NextResponse } from "next/server";
import { getListingById, updateListing } from "@/lib/bnhub/listings";
import { canPublishListingMandatory } from "@/lib/bnhub/mandatory-verification";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = clientIp(request);
    const limit = checkRateLimit(`public:bnhub-listing-detail:${ip}`, { windowMs: 60_000, max: 120 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

function buildUpdateData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  const fields = [
    "title", "subtitle", "description", "propertyType", "roomType", "category",
    "address", "city", "region", "country", "nightPriceCents", "currency",
    "beds", "bedrooms", "baths", "maxGuests", "houseRules", "checkInInstructions",
    "checkInTime", "checkOutTime", "cancellationPolicy", "cleaningFeeCents",
    "securityDepositCents", "instantBookEnabled",
    "minStayNights", "maxStayNights", "listingStatus", "parkingDetails", "neighborhoodDetails",
    "conditionOfProperty", "knownIssues",
  ];
  for (const k of fields) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (Array.isArray(body.photos)) data.photos = body.photos;
  if (Array.isArray(body.amenities)) data.amenities = body.amenities;
  if (Array.isArray(body.safetyFeatures)) data.safetyFeatures = body.safetyFeatures;
  if (Array.isArray(body.accessibilityFeatures)) data.accessibilityFeatures = body.accessibilityFeatures;
  return data;
}

async function onListingFirstPublished(
  id: string,
  listing: { ownerId: string; listingStatus: string },
  source: "bnhub_put" | "bnhub_patch"
) {
  try {
    const { createListingContract } = await import("@/lib/hubs/contracts");
    await createListingContract({
      listingId: id,
      userId: listing.ownerId,
      hub: "bnhub",
    });
  } catch (e) {
    console.warn("[listings] Failed to create listing contract:", e);
  }
  captureServerEvent(listing.ownerId, AnalyticsEvents.LISTING_PUBLISHED, {
    listingId: id,
    source,
  });
  try {
    const { queueSocialContentForPublishedListing } = await import(
      "@/src/modules/growth-automation/application/listingSocialAutopost"
    );
    await queueSocialContentForPublishedListing(id);
  } catch (e) {
    console.warn("[listings] Social autopost skipped or failed:", e);
  }
}

async function assertCanPublish(listingId: string) {
  const { allowed, reasons } = await canPublishListingMandatory(listingId);
  if (!allowed) {
    const message =
      reasons.length > 0
        ? reasons.join(". ")
        : "Cannot publish: complete owner verification (full name, ID verification, ownership confirmation) and property details (address, images).";
    return { ok: false as const, error: message, reasons };
  }
  if (enforceableContractsRequired()) {
    const row = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
    if (!row) {
      return { ok: false as const, error: "Listing not found", reasons: [] };
    }
    const signed = await hasActiveEnforceableContract(row.ownerId, ENFORCEABLE_CONTRACT_TYPES.HOST, {
      listingId,
    });
    if (!signed) {
      return {
        ok: false as const,
        error:
          "Sign the BNHUB host agreement before publishing (ContractSign kind=host with this listing id).",
        reasons: ["enforceable_host"],
      };
    }
  }
  return { ok: true as const };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = buildUpdateData(body);
    if (data.listingStatus === "PUBLISHED") {
      const result = await assertCanPublish(id);
      if (!result.ok) {
        return Response.json(
          { error: result.error, reasons: result.reasons },
          { status: 400 }
        );
      }
    }
    const prev = await prisma.shortTermListing.findUnique({
      where: { id },
      select: { listingStatus: true },
    });
    const listing = await updateListing(id, data);
    const becamePublished =
      listing.listingStatus === "PUBLISHED" &&
      data.listingStatus === "PUBLISHED" &&
      prev?.listingStatus !== "PUBLISHED";
    if (becamePublished) {
      await onListingFirstPublished(id, listing, "bnhub_put");
    }
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = buildUpdateData(body);
    if (data.listingStatus === "PUBLISHED") {
      const result = await assertCanPublish(id);
      if (!result.ok) {
        return Response.json(
          { error: result.error, reasons: result.reasons },
          { status: 400 }
        );
      }
    }
    const prev = await prisma.shortTermListing.findUnique({
      where: { id },
      select: { listingStatus: true },
    });
    const listing = await updateListing(id, data);
    const becamePublished =
      listing.listingStatus === "PUBLISHED" &&
      data.listingStatus === "PUBLISHED" &&
      prev?.listingStatus !== "PUBLISHED";
    if (becamePublished) {
      await onListingFirstPublished(id, listing, "bnhub_patch");
    }
    return Response.json(listing);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
