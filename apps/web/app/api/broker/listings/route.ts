import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { getListingsForBroker } from "@/lib/broker/collaboration";
import { logApi } from "@/lib/server/launch-logger";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";
import { ensureCoOwnershipChecklist } from "@/services/compliance/coownershipCompliance.service";
import { dispatchLecipmCoreAutopilotEvent } from "@/src/modules/autopilot/engine";
import type { LecipmListingAssetType } from "@prisma/client";
import { safeParseBrokerCrmListingBody } from "@/lib/validation/broker-crm-listing-create";

export const dynamic = "force-dynamic";

const ASSET_TYPES: LecipmListingAssetType[] = ["HOUSE", "CONDO", "MULTI_UNIT", "TOWNHOUSE", "LAND", "OTHER"];

function parseAssetType(raw: unknown): LecipmListingAssetType | undefined {
  if (typeof raw !== "string") return undefined;
  const u = raw.trim().toUpperCase();
  return ASSET_TYPES.includes(u as LecipmListingAssetType) ? (u as LecipmListingAssetType) : undefined;
}

/** GET: list listings the current broker can access (owned + shared). */
export async function GET() {
  const brokerId = await getGuestId();
  if (!brokerId) {
    return Response.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  try {
    const listings = await getListingsForBroker(brokerId);
    return Response.json(listings);
  } catch (e) {
    logApi.error("GET /api/broker/listings failed", { message: e instanceof Error ? e.message : String(e) });
    return Response.json({ success: false, error: "Failed to list listings" }, { status: 500 });
  }
}

/** POST: create a listing (current user becomes owner) and grant self owner access. */
export async function POST(req: NextRequest) {
  const brokerId = await getGuestId();
  if (!brokerId) {
    return Response.json({ success: false, error: "Sign in required" }, { status: 401 });
  }
  try {
    const rawBody = await req.json().catch(() => ({}));
    const validated = safeParseBrokerCrmListingBody(rawBody);
    if (!validated.ok) {
      return Response.json({ success: false, error: validated.error }, { status: 400 });
    }
    const title = validated.title ?? "New listing";
    const listingType =
      validated.listingType ??
      parseAssetType((rawBody as { listingType?: unknown }).listingType ?? (rawBody as { type?: unknown }).type) ??
      "HOUSE";
    const isCoOwnership = typeof validated.isCoOwnership === "boolean" ? validated.isCoOwnership : false;
    const rawPrice = validated.price ?? (rawBody as { price?: unknown }).price;
    const priceNum =
      rawPrice === undefined || rawPrice === null || rawPrice === ""
        ? 0
        : typeof rawPrice === "number"
          ? rawPrice
          : Number(rawPrice);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return Response.json({ success: false, error: "price must be a non-negative number" }, { status: 400 });
    }
    const listing = await prisma.$transaction(async (tx) => {
      const listingCode = await allocateUniqueLSTListingCode(tx);
      return tx.listing.create({
        data: {
          listingCode,
          title: String(title),
          price: priceNum,
          ownerId: brokerId,
          listingType,
          isCoOwnership,
          /** Draft until explicitly published via POST /api/broker/listings/:id/publish */
          crmMarketplaceLive: false,
        },
      });
    });
    await ensureCoOwnershipChecklist(listing.id).catch(() => null);
    await prisma.brokerListingAccess.create({
      data: {
        listingId: listing.id,
        brokerId,
        role: "owner",
        grantedById: brokerId,
      },
    });
    captureServerEvent(brokerId, AnalyticsEvents.LISTING_CREATED, {
      listingId: listing.id,
      source: "broker_listings",
    });
    void dispatchLecipmCoreAutopilotEvent({
      eventType: "listing_created",
      targetType: "listing",
      targetId: listing.id,
      metadata: { source: "broker_listings_post" },
    }).catch(() => null);
    return Response.json({ ...listing, success: true, data: listing });
  } catch (e) {
    logApi.error("POST /api/broker/listings failed", { message: e instanceof Error ? e.message : String(e) });
    return Response.json({ success: false, error: "Failed to create listing" }, { status: 500 });
  }
}
