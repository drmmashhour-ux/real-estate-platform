import type { FsboListing, FsboListingVerification } from "@prisma/client";
import { migrateLegacySellerDeclaration, declarationSectionCounts } from "@/lib/fsbo/seller-declaration-schema";
import type { TrustConfidenceBreakdown } from "../domain/trustScore.types";

export type TrustConfidenceContext = {
  listing: FsboListing & { verification: FsboListingVerification | null };
  images: string[];
  tagArr: string[];
};

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * TrustConfidence = 0.30*Address + 0.20*Media + 0.20*Identity + 0.15*Declaration + 0.15*Legal
 */
export function computeTrustConfidence(ctx: TrustConfidenceContext): TrustConfidenceBreakdown {
  const { listing, images, tagArr } = ctx;
  const addr = listing.address?.trim() ?? "";
  const city = listing.city?.trim() ?? "";
  let addressConfidence = 40;
  if (addr.length >= 12 && city.length >= 2) addressConfidence = 88;
  else if (addr.length >= 8 && city.length >= 2) addressConfidence = 72;
  else if (addr.length >= 4 && city.length >= 2) addressConfidence = 58;
  if (/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(addr) || /H[0-9][A-Z]\s?\d[A-Z]\d/i.test(addr)) {
    addressConfidence = Math.min(100, addressConfidence + 5);
  }

  const nImg = images.length;
  let mediaConfidence = 38;
  if (nImg >= 6 && tagArr.length >= nImg * 0.5) mediaConfidence = 90;
  else if (nImg >= 4 && tagArr.length) mediaConfidence = 75;
  else if (nImg >= 3) mediaConfidence = 62;
  else if (nImg >= 1) mediaConfidence = 48;

  const v = listing.verification;
  let identityConfidence = 38;
  if (v?.identityStatus === "VERIFIED") identityConfidence = 95;
  else if (v?.identityStatus === "PENDING") identityConfidence = 58;

  const decl = migrateLegacySellerDeclaration(listing.sellerDeclarationJson);
  const { completed, total } = declarationSectionCounts(decl, listing.propertyType);
  let declarationConfidence =
    total > 0 ? clamp((100 * completed) / total) : 40;
  if (listing.sellerDeclarationCompletedAt) declarationConfidence = 95;

  let legalConfidence = 78;
  if (typeof listing.riskScore === "number") {
    legalConfidence = clamp(100 - listing.riskScore * 0.85);
  }

  return {
    addressConfidence: clamp(addressConfidence),
    mediaConfidence: clamp(mediaConfidence),
    identityConfidence: clamp(identityConfidence),
    declarationConfidence: clamp(declarationConfidence),
    legalConfidence: clamp(legalConfidence),
  };
}

export function aggregateTrustConfidence(b: TrustConfidenceBreakdown): number {
  const s =
    0.3 * b.addressConfidence +
    0.2 * b.mediaConfidence +
    0.2 * b.identityConfidence +
    0.15 * b.declarationConfidence +
    0.15 * b.legalConfidence;
  return clamp(s);
}
