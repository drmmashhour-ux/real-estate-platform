/**
 * ORDER SYBNB-80 — Trust / CTR badges for browse cards computed entirely on the server.
 * Mirrors `ListingCard` badge precedence without repeating sorting/filter logic on the device.
 */
import {
  getListingPhotoTrustTier,
  isListingFraudFlagged,
  shouldShowTrustedListingBadge,
  isSellerVerifiedForListingTrust,
} from "@/lib/listing-trust-badges";
import { isNewListing } from "@/lib/syria-phone";
import { isOwnershipVerificationTierListing } from "@/lib/listing-posting-kind";

export type BrowseCtrBadgeKind =
  | "trusted_listing"
  | "verified_seller"
  | "ownership_confirmed"
  | "ownership_not_verified"
  | "proof_documents"
  | "photo_full"
  | "photo_clear"
  | "new";

export function computeBrowseCtrBadgeKinds(args: {
  verified: boolean | null | undefined;
  listingVerified: boolean | null | undefined;
  sy8SellerVerified: boolean | null | undefined;
  fraudFlag: boolean | null | undefined;
  listingPhotoCount: number;
  /** Normalized amenity key count (SYBNB-FINAL: trusted listing requires ≥2). */
  amenityCount: number;
  createdAtIso: string;
  proofDocumentsSubmitted?: boolean | null | undefined;
  category: string;
  postingKind?: string | null | undefined;
  ownershipVerified?: boolean | null | undefined;
}): BrowseCtrBadgeKind[] {
  const sellerVerified = isSellerVerifiedForListingTrust({
    verified: args.verified,
    listingVerified: args.listingVerified,
    sy8SellerVerified: args.sy8SellerVerified,
  });
  const fraudFlagged = isListingFraudFlagged(args.fraudFlag);
  const showTrustedListingBadgeUi = shouldShowTrustedListingBadge({
    sellerVerified,
    imageCount: args.listingPhotoCount,
    amenityCount: args.amenityCount,
    fraudFlag: args.fraudFlag,
  });
  const showVerifiedSellerOnly = sellerVerified && !showTrustedListingBadgeUi && !fraudFlagged;

  const out: BrowseCtrBadgeKind[] = [];
  if (showTrustedListingBadgeUi) out.push("trusted_listing");
  else if (showVerifiedSellerOnly) out.push("verified_seller");

  if (isOwnershipVerificationTierListing(args.category, args.postingKind) && !fraudFlagged) {
    if (args.ownershipVerified === true) {
      out.push("ownership_confirmed");
    } else {
      out.push("ownership_not_verified");
    }
  }

  if (args.proofDocumentsSubmitted === true && !fraudFlagged) {
    out.push("proof_documents");
  }

  const tier = getListingPhotoTrustTier(args.listingPhotoCount);
  if (tier === "full") out.push("photo_full");
  else if (tier === "clear") out.push("photo_clear");

  const created = new Date(args.createdAtIso);
  if (!Number.isNaN(created.getTime()) && isNewListing(created)) {
    out.push("new");
  }

  /** ORDER SYBNB-101 — allow one extra chip for ownership verification signals (still capped). */
  return out.slice(0, 4);
}
