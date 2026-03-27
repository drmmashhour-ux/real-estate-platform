import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { FSBO_MODERATION, FSBO_STATUS } from "@/lib/fsbo/constants";

export type TestFixtures = {
  listingId: string;
  declarationDraftId: string;
  propertyIdentityId: string;
  transactionId: string;
  sellerUserId: string;
  buyerUserId: string;
};

/**
 * Minimal ACTIVE FSBO listing + declaration draft + property identity + transaction for legal/negotiation flows.
 */
export async function ensureTestFixtures(args: {
  sellerUserId: string;
  buyerUserId: string;
}): Promise<TestFixtures> {
  const { sellerUserId, buyerUserId } = args;

  const listing = await prisma.fsboListing.create({
    data: {
      ownerId: sellerUserId,
      title: "[SV] LECIPM validation listing",
      description: "System validation fixture — safe to delete with test users.",
      priceCents: 450_000_00,
      address: "1 Test Lane",
      city: "Montreal",
      images: [],
      status: FSBO_STATUS.ACTIVE,
      moderationStatus: FSBO_MODERATION.APPROVED,
      contactEmail: "sv-listing@test.lecipm.invalid",
      riskScore: 35,
      trustScore: 62,
      propertyType: "SINGLE_FAMILY",
    },
    select: { id: true },
  });

  const draft = await prisma.sellerDeclarationDraft.create({
    data: {
      listingId: listing.id,
      sellerUserId,
      status: "draft",
      draftPayload: {
        water_damage_flag: false,
        tenant_present: false,
        legal_dispute_flag: false,
        renovations_flag: false,
        environmental_flag: false,
        owner_occupied: true,
      },
    },
    select: { id: true },
  });

  const propertyUid = `sv-${randomUUID()}`;
  const identity = await prisma.propertyIdentity.create({
    data: {
      propertyUid,
      officialAddress: "1 Test Lane",
      normalizedAddress: "1 test lane montreal qc",
      municipality: "Montreal",
      province: "QC",
      country: "CA",
      propertyType: "SINGLE_FAMILY",
    },
    select: { id: true },
  });

  const tx = await prisma.realEstateTransaction.create({
    data: {
      propertyIdentityId: identity.id,
      listingId: listing.id,
      buyerId: buyerUserId,
      sellerId: sellerUserId,
      offerPrice: 440_000_00,
      status: "negotiation",
    },
    select: { id: true },
  });

  return {
    listingId: listing.id,
    declarationDraftId: draft.id,
    propertyIdentityId: identity.id,
    transactionId: tx.id,
    sellerUserId,
    buyerUserId,
  };
}
