import type { ShortTermListing } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOrLink } from "@/lib/property-identity/create-or-link";
import { canPublishListingMandatory } from "@/lib/bnhub/mandatory-verification";
import { ensureHostListingContract } from "@/lib/contracts/bnhub-host-contracts";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

type FlowOpts = {
  listing: ShortTermListing;
  ownerId: string;
  address: string;
  city: string;
  region?: string | null;
  country?: string | null;
  cadastreNumber?: string | null;
  municipality?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyType?: string | null;
  /** Analytics source label */
  source: string;
};

/**
 * Property identity, contracts, publish gates, and analytics — shared by BNHUB create + fast wizard.
 */
export async function postCreateShortTermListingFlow(
  opts: FlowOpts
): Promise<{ listing: ShortTermListing; publishError?: string; publishReasons?: string[] }> {
  let listing = opts.listing;

  try {
    await ensureHostListingContract(listing.id);
  } catch (e) {
    console.warn("[listings] ensure host contract failed:", e);
  }

  if (opts.address && opts.city) {
    try {
      const result = await createOrLink({
        listingId: listing.id,
        listingType: "short_term_rental",
        linkedByUserId: opts.ownerId,
        cadastreNumber: opts.cadastreNumber ?? null,
        officialAddress: opts.address,
        municipality: opts.municipality ?? null,
        province: opts.province ?? null,
        country: opts.country ?? null,
        latitude: opts.latitude != null ? Number(opts.latitude) : null,
        longitude: opts.longitude != null ? Number(opts.longitude) : null,
        propertyType: opts.propertyType ?? null,
      });
      if (result.linkStatus === "active") {
        await prisma.shortTermListing.update({
          where: { id: listing.id },
          data: { propertyIdentityId: result.propertyIdentityId },
        });
        listing = (await prisma.shortTermListing.findUniqueOrThrow({
          where: { id: listing.id },
        })) as ShortTermListing;
      }
    } catch (e) {
      console.warn("Property identity create-or-link failed (listing still created):", e);
    }
  }

  if (listing.listingStatus === "PUBLISHED") {
    const { allowed, reasons } = await canPublishListingMandatory(listing.id);
    if (!allowed) {
      await prisma.shortTermListing.update({
        where: { id: listing.id },
        data: { listingStatus: "DRAFT" },
      });
      listing = (await prisma.shortTermListing.findUniqueOrThrow({
        where: { id: listing.id },
      })) as ShortTermListing;
      const message =
        reasons.length > 0
          ? reasons.join(". ")
          : "Cannot publish: complete owner verification (full name, ID verification, ownership confirmation) and property details (address, images).";
      return { listing, publishError: message, publishReasons: reasons };
    }
    if (enforceableContractsRequired()) {
      const signed = await hasActiveEnforceableContract(opts.ownerId, ENFORCEABLE_CONTRACT_TYPES.HOST, {
        listingId: listing.id,
      });
      if (!signed) {
        await prisma.shortTermListing.update({
          where: { id: listing.id },
          data: { listingStatus: "DRAFT" },
        });
        listing = (await prisma.shortTermListing.findUniqueOrThrow({
          where: { id: listing.id },
        })) as ShortTermListing;
        return {
          listing,
          publishError:
            "Sign the BNHUB host agreement before publishing (ContractSign kind=host with this listing id).",
          publishReasons: ["enforceable_host"],
        };
      }
    }
    try {
      const { createListingContract } = await import("@/lib/hubs/contracts");
      await createListingContract({
        listingId: listing.id,
        userId: opts.ownerId,
        hub: "bnhub",
      });
    } catch (e) {
      console.warn("[listings] Failed to create listing contract:", e);
    }
  }

  captureServerEvent(opts.ownerId, AnalyticsEvents.LISTING_CREATED, {
    listingId: listing.id,
    source: opts.source,
  });
  if (listing.listingStatus === "PUBLISHED") {
    captureServerEvent(opts.ownerId, AnalyticsEvents.LISTING_PUBLISHED, {
      listingId: listing.id,
      source: opts.source,
    });
  }

  return { listing };
}
