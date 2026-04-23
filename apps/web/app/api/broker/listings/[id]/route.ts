import { NextRequest, NextResponse } from "next/server";
import { LecipmListingAssetType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@repo/db";
import {
  ERR_COOWNERSHIP_PUBLISH,
  assertCoownershipPublishAllowed,
  ensureCoOwnershipChecklist,
} from "@/services/compliance/coownershipCompliance.service";
import { dispatchLecipmCoreAutopilotEvent } from "@/src/modules/autopilot/engine";
import { ensureEsgProfileForListing } from "@/modules/esg/esg.service";

export const dynamic = "force-dynamic";

const TYPES: LecipmListingAssetType[] = ["HOUSE", "CONDO", "MULTI_UNIT", "TOWNHOUSE", "LAND", "OTHER"];

function parseListingType(raw: unknown): LecipmListingAssetType | undefined {
  if (typeof raw !== "string") return undefined;
  const u = raw.trim().toUpperCase();
  return TYPES.includes(u as LecipmListingAssetType) ? (u as LecipmListingAssetType) : undefined;
}

/**
 * PATCH — update CRM listing fields used for co-ownership compliance (and basic title/price).
 * Optional `validatePublication: true` runs enforcement when FEATURE_COOWNERSHIP_ENFORCEMENT is on (no Stripe).
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    title?: string;
    price?: number;
    listingType?: LecipmListingAssetType;
    isCoOwnership?: boolean;
    crmMarketplaceLive?: boolean;
  } = {};

  if (typeof body.title === "string") data.title = body.title;
  if (body.price != null) {
    const n = Number(body.price);
    if (!Number.isNaN(n)) data.price = n;
  }
  const lt = parseListingType(body.listingType ?? body.type);
  if (lt !== undefined) data.listingType = lt;
  if (typeof body.isCoOwnership === "boolean") data.isCoOwnership = body.isCoOwnership;
  if (typeof body.crmMarketplaceLive === "boolean") data.crmMarketplaceLive = body.crmMarketplaceLive;

  try {
    if (body.validatePublication === true) {
      await assertCoownershipPublishAllowed(id);
    }

    if (data.crmMarketplaceLive === true) {
      await ensureCoOwnershipChecklist(id);
      await assertCoownershipPublishAllowed(id);
    }

    const hasFieldUpdates = Object.keys(data).length > 0;
    if (!hasFieldUpdates && body.validatePublication !== true) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const listing = hasFieldUpdates
      ? await prisma.listing.update({
          where: { id },
          data,
          include: {
            owner: { select: { id: true, name: true, email: true } },
            brokerAccesses: {
              include: { broker: { select: { id: true, name: true, email: true } } },
            },
          },
        })
      : await prisma.listing.findUniqueOrThrow({
          where: { id },
          include: {
            owner: { select: { id: true, name: true, email: true } },
            brokerAccesses: {
              include: { broker: { select: { id: true, name: true, email: true } } },
            },
          },
        });

    if (hasFieldUpdates) {
      await ensureCoOwnershipChecklist(id);
      try {
        const { invalidateComplianceStatusCache } = await import("@/lib/compliance/coownership-compliance-cache");
        invalidateComplianceStatusCache(id);
      } catch {
        /* optional */
      }
      void dispatchLecipmCoreAutopilotEvent({
        eventType: "listing_updated",
        targetType: "listing",
        targetId: id,
        metadata: { source: "broker_listings_patch" },
      }).catch(() => null);
      void ensureEsgProfileForListing(id).catch(() => null);
    }

    return NextResponse.json(listing);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === ERR_COOWNERSHIP_PUBLISH) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
