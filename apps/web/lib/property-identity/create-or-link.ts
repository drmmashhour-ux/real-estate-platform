/**
 * Create-or-link workflow: find existing property identity or create new one, then link listing.
 */

import { prisma } from "@/lib/db";
import { generatePropertyUid } from "./uid";
import { normalizeAddress } from "./normalize";
import type { ListingType } from "./constants";
import { checkDuplicateOutcome } from "./duplicate-rules";
import { recordEvent } from "./events";

export interface CreateOrLinkInput {
  listingId: string;
  listingType: ListingType;
  linkedByUserId: string;
  cadastreNumber?: string | null;
  officialAddress: string;
  municipality?: string | null;
  province?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyType?: string | null;
}

export interface CreateOrLinkResult {
  propertyIdentityId: string;
  propertyUid: string;
  linkId: string;
  linkStatus: string;
  duplicateOutcome: "allowed" | "blocked" | "manual_review_required";
  isNewIdentity: boolean;
}

/**
 * Find existing PropertyIdentity by cadastre number (if provided) or by property_uid.
 * Also search by normalized address + municipality + province to catch same property with different cadastre format.
 */
async function findExistingIdentity(input: CreateOrLinkInput): Promise<{ id: string; propertyUid: string } | null> {
  const normalizedAddr = normalizeAddress(input.officialAddress);
  const uid = generatePropertyUid({
    cadastreNumber: input.cadastreNumber,
    officialAddress: input.officialAddress,
    municipality: input.municipality,
    province: input.province,
    country: input.country,
  });

  // 1. Exact UID match
  const byUid = await prisma.propertyIdentity.findUnique({
    where: { propertyUid: uid },
    select: { id: true, propertyUid: true },
  });
  if (byUid) return byUid;

  // 2. Same cadastre (if provided)
  if (input.cadastreNumber && input.cadastreNumber.trim()) {
    const byCadastre = await prisma.propertyIdentity.findFirst({
      where: {
        cadastreNumber: { equals: input.cadastreNumber.trim(), mode: "insensitive" },
      },
      select: { id: true, propertyUid: true },
    });
    if (byCadastre) return byCadastre;
  }

  // 3. Same normalized address + municipality + province
  const municipality = (input.municipality || "").trim().toLowerCase();
  const province = (input.province || "").trim().toUpperCase();
  if (normalizedAddr && (municipality || province)) {
    const byAddress = await prisma.propertyIdentity.findFirst({
      where: {
        normalizedAddress: { equals: normalizedAddr, mode: "insensitive" },
        ...(municipality && { municipality: { equals: municipality, mode: "insensitive" } }),
        ...(province && { province: { equals: province, mode: "insensitive" } }),
      },
      select: { id: true, propertyUid: true },
    });
    if (byAddress) return byAddress;
  }

  return null;
}

/**
 * Create new PropertyIdentity and first link.
 */
async function createIdentityAndLink(
  input: CreateOrLinkInput,
  linkStatus: "pending" | "active"
): Promise<{ propertyIdentityId: string; propertyUid: string; linkId: string }> {
  const normalizedAddr = normalizeAddress(input.officialAddress);
  const uid = generatePropertyUid({
    cadastreNumber: input.cadastreNumber,
    officialAddress: input.officialAddress,
    municipality: input.municipality,
    province: input.province,
    country: input.country,
  });

  const identity = await prisma.propertyIdentity.create({
    data: {
      propertyUid: uid,
      cadastreNumber: input.cadastreNumber?.trim() || null,
      officialAddress: input.officialAddress.trim(),
      normalizedAddress: normalizedAddr || input.officialAddress.trim(),
      municipality: input.municipality?.trim() || null,
      province: input.province?.trim() || null,
      country: (input.country && input.country.trim()) || "US",
      postalCode: input.postalCode?.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      propertyType: input.propertyType?.trim() || null,
    },
  });

  const link = await prisma.propertyIdentityLink.create({
    data: {
      propertyIdentityId: identity.id,
      listingId: input.listingId,
      listingType: input.listingType,
      linkedByUserId: input.linkedByUserId,
      linkStatus,
    },
  });

  await recordEvent(identity.id, "identity_created", { listingId: input.listingId, listingType: input.listingType }, input.linkedByUserId);
  if (linkStatus === "active") {
    await recordEvent(identity.id, "listing_linked", { linkId: link.id, listingId: input.listingId }, input.linkedByUserId);
  }

  return { propertyIdentityId: identity.id, propertyUid: identity.propertyUid, linkId: link.id };
}

/**
 * Link an existing listing to an existing PropertyIdentity. Returns link status based on duplicate rules.
 */
async function linkToExisting(
  propertyIdentityId: string,
  propertyUid: string,
  input: CreateOrLinkInput,
  duplicateOutcome: "allowed" | "blocked" | "manual_review_required"
): Promise<{ linkId: string; linkStatus: string }> {
  const linkStatus =
    duplicateOutcome === "blocked" ? "rejected" : duplicateOutcome === "manual_review_required" ? "pending" : "active";

  const link = await prisma.propertyIdentityLink.create({
    data: {
      propertyIdentityId,
      listingId: input.listingId,
      listingType: input.listingType,
      linkedByUserId: input.linkedByUserId,
      linkStatus,
    },
  });

  if (linkStatus === "rejected") {
    await recordEvent(propertyIdentityId, "listing_rejected", { linkId: link.id, listingId: input.listingId, reason: "duplicate_blocked" }, input.linkedByUserId);
  } else if (linkStatus === "pending") {
    await recordEvent(propertyIdentityId, "manual_review_requested", { linkId: link.id, listingId: input.listingId }, input.linkedByUserId);
  } else {
    await recordEvent(propertyIdentityId, "listing_linked", { linkId: link.id, listingId: input.listingId }, input.linkedByUserId);
  }

  return { linkId: link.id, linkStatus };
}

/**
 * Main create-or-link workflow. Call before listing publication.
 */
export async function createOrLink(input: CreateOrLinkInput): Promise<CreateOrLinkResult> {
  const existing = await findExistingIdentity(input);

  if (existing) {
    const duplicateOutcome = await checkDuplicateOutcome(existing.id, input.listingId, input.listingType, input.linkedByUserId);
    const { linkId, linkStatus } = await linkToExisting(existing.id, existing.propertyUid, input, duplicateOutcome);
    return {
      propertyIdentityId: existing.id,
      propertyUid: existing.propertyUid,
      linkId,
      linkStatus,
      duplicateOutcome,
      isNewIdentity: false,
    };
  }

  const duplicateOutcome = await checkDuplicateOutcome(null, input.listingId, input.listingType, input.linkedByUserId);
  const linkStatus = duplicateOutcome === "blocked" ? "rejected" : duplicateOutcome === "manual_review_required" ? "pending" : "active";
  const { propertyIdentityId, propertyUid, linkId } = await createIdentityAndLink(input, linkStatus === "rejected" ? "pending" : linkStatus);
  return {
    propertyIdentityId,
    propertyUid,
    linkId,
    linkStatus,
    duplicateOutcome,
    isNewIdentity: true,
  };
}
