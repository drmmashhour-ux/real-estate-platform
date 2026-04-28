import { isSy8SellerVerified } from "@/lib/sy8/sy8-reputation";

/** ORDER SYBNB-64 — seller/account verified enough for trust UI on browse + listing detail. */
export function isSellerVerifiedForListingTrust(args: {
  verified?: boolean | null;
  listingVerified?: boolean | null;
  sy8SellerVerified?: boolean | null;
  owner?: Parameters<typeof isSy8SellerVerified>[0] | null;
}): boolean {
  if (args.sy8SellerVerified === true) return true;
  if (args.verified === true || args.listingVerified === true) return true;
  if (args.owner) return isSy8SellerVerified(args.owner);
  return false;
}

export function isListingFraudFlagged(fraudFlag: boolean | undefined | null): boolean {
  return fraudFlag === true;
}

/** Trusted listing chip: verified seller + ≥3 photos + not fraud-flagged. */
export function shouldShowTrustedListingBadge(args: {
  sellerVerified: boolean;
  imageCount: number;
  fraudFlag: boolean | undefined | null;
}): boolean {
  return args.sellerVerified && args.imageCount >= 3 && !isListingFraudFlagged(args.fraudFlag);
}

export type ListingPhotoTrustTier = "none" | "clear" | "full";

/** SYBNB-64: ≥3 → clear photos; ≥5 → full gallery signal (premium perception). */
export function getListingPhotoTrustTier(imageCount: number): ListingPhotoTrustTier {
  if (imageCount >= 5) return "full";
  if (imageCount >= 3) return "clear";
  return "none";
}
