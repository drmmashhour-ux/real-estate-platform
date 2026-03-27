import type { FsboListing } from "@prisma/client";
import type { BrokerVerificationRuleContext, FsboListingRuleContext } from "@/lib/trustgraph/domain/types";

export function evidenceRef(ruleCode: string, detail: Record<string, unknown>): Record<string, unknown> {
  return {
    engine: "trustgraph",
    ruleCode,
    ...detail,
  };
}

type ListingWithOwnerPlan = Pick<
  FsboListing,
  | "id"
  | "ownerId"
  | "title"
  | "description"
  | "address"
  | "city"
  | "propertyType"
  | "images"
  | "photoTagsJson"
  | "sellerDeclarationJson"
  | "sellerDeclarationCompletedAt"
  | "priceCents"
> & { owner?: { sellerPlan: string | null } | null };

/**
 * Normalizes DB listing rows into the deterministic rule context (no I/O).
 */
export function buildFsboListingRuleContextFromListing(listing: ListingWithOwnerPlan): FsboListingRuleContext {
  return {
    listingId: listing.id,
    ownerId: listing.ownerId,
    sellerPlan: listing.owner?.sellerPlan ?? null,
    title: listing.title ?? "",
    description: listing.description ?? "",
    address: listing.address ?? "",
    city: listing.city ?? "",
    priceCents: typeof listing.priceCents === "number" ? listing.priceCents : 0,
    propertyType: listing.propertyType,
    images: Array.isArray(listing.images) ? listing.images : [],
    photoTagsJson: listing.photoTagsJson,
    sellerDeclarationJson: listing.sellerDeclarationJson,
    sellerDeclarationCompletedAt: listing.sellerDeclarationCompletedAt,
  };
}

type UserForBroker = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
};

type Bv = { licenseNumber: string; brokerageCompany: string } | null | undefined;

export function buildBrokerVerificationContextFromUser(user: UserForBroker, brokerVerification: Bv): BrokerVerificationRuleContext {
  const lic = brokerVerification?.licenseNumber?.trim() ?? "";
  const co = brokerVerification?.brokerageCompany?.trim() ?? "";
  return {
    userId: user.id,
    email: user.email,
    displayName: user.name ?? null,
    phone: user.phone ?? null,
    licenseNumber: lic.length > 0 ? lic : null,
    brokerageCompany: co.length > 0 ? co : null,
  };
}
