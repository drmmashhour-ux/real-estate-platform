import type { FsboListing, FsboListingVerification } from "@prisma/client";
import type { TrustComponentBreakdown } from "../domain/trustScore.types";
import {
  addressHasUnitNumber,
  scoreAddressValidity,
  scoreDataConsistency,
  scoreIdentityVerification,
  scoreLegalReadiness,
  scoreMediaQuality,
  scoreSellerDeclaration,
  type TrustNumericContext,
} from "./trustNumericTables";

export type ListingTrustContext = {
  listing: FsboListing & {
    verification: FsboListingVerification | null;
  };
  hasDuplicateImagesAcrossListings?: boolean;
};

const W_RAW = {
  addressValidity: 0.2,
  mediaQuality: 0.15,
  identityVerification: 0.2,
  sellerDeclarationCompleteness: 0.15,
  legalReadiness: 0.15,
  dataConsistency: 0.15,
} as const;

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Re-export for fraud / graph helpers */
export { addressHasUnitNumber } from "./trustNumericTables";

/**
 * Deterministic trust components (numeric tables) + human-readable issues/codes.
 */
export function computeTrustComponents(ctx: ListingTrustContext): {
  breakdown: TrustComponentBreakdown;
  issues: string[];
  strengths: string[];
  issueCodes: string[];
  strengthCodes: string[];
} {
  const { listing } = ctx;
  const images = Array.isArray(listing.images) ? listing.images : [];
  const tags = listing.photoTagsJson;
  const tagArr = Array.isArray(tags) ? tags.filter((x): x is string => typeof x === "string") : [];

  const numCtx: TrustNumericContext = {
    listing: { ...listing, verification: listing.verification },
    images,
    tagArr,
    hasDuplicateImagesAcrossListings: ctx.hasDuplicateImagesAcrossListings === true,
  };

  const issues: string[] = [];
  const strengths: string[] = [];
  const issueCodes: string[] = [];
  const strengthCodes: string[] = [];

  const pushIssue = (code: string, msg: string) => {
    issueCodes.push(code);
    issues.push(msg);
  };
  const pushStrength = (code: string, msg: string) => {
    strengthCodes.push(code);
    strengths.push(msg);
  };

  const addr = listing.address?.trim() ?? "";
  const city = listing.city?.trim() ?? "";
  const pt = (listing.propertyType ?? "").toUpperCase();
  const looksCondo = pt.includes("CONDO");

  const addressValidity = scoreAddressValidity(numCtx);
  if (addr.length < 3 || city.length < 2) pushIssue("ADDR_INVALID", "Address or city is incomplete or unverifiable.");
  else if (looksCondo && /house|maison unifamiliale/i.test(addr))
    pushIssue("ADDR_TYPE_MISMATCH", "Property type vs address wording conflict (condo vs house).");
  else if (looksCondo && !addressHasUnitNumber(addr))
    pushIssue("CONDO_MISSING_UNIT", "Condo listing should include a unit number.");
  else if (addr.length >= 12) pushStrength("ADDR_VALID", "Address and city are sufficiently complete.");

  const mediaQuality = scoreMediaQuality(numCtx);
  const nImg = images.length;
  if (nImg === 0) pushIssue("MEDIA_NONE", "No listing photos.");
  if (numCtx.hasDuplicateImagesAcrossListings) pushIssue("MEDIA_DUPLICATE", "Duplicate image URL used on another listing.");
  if (images.some((u) => /\.pdf(\?|$)/i.test(u.trim()))) pushIssue("MEDIA_IRRELEVANT_TYPE", "Non-image file in gallery.");
  if (nImg >= 5 && tagArr.some((t) => t.toUpperCase().includes("EXTERIOR")) && tagArr.some((t) => t.toUpperCase().includes("INTERIOR")))
    pushStrength("MEDIA_FULL_SET", "Photo set includes exterior and interior.");

  const identityVerification = scoreIdentityVerification(listing);
  const v = listing.verification;
  if (v?.identityStatus === "VERIFIED") pushStrength("IDENTITY_VERIFIED", "Identity verification on file.");
  else if (v?.identityStatus === "PENDING") pushIssue("IDENTITY_PARTIAL", "Identity verification pending.");
  else pushIssue("IDENTITY_NONE", "No identity verification.");

  const sellerDeclarationCompleteness = scoreSellerDeclaration(listing);
  if (listing.sellerDeclarationCompletedAt) pushStrength("DECLARATION_DONE", "Seller declaration completed.");
  else pushIssue("DECLARATION_INCOMPLETE", "Seller declaration incomplete.");

  const legalReadiness = scoreLegalReadiness(listing.riskScore);
  if (typeof listing.riskScore === "number" && listing.riskScore > 65) pushIssue("LEGAL_HIGH_RISK", "Elevated risk flags on file.");

  const dataConsistency = scoreDataConsistency(listing);
  if (dataConsistency >= 75) pushStrength("DATA_CONSISTENT", "Core numeric fields look internally consistent.");

  const breakdown: TrustComponentBreakdown = {
    addressValidity: clamp(addressValidity),
    mediaQuality: clamp(mediaQuality),
    identityVerification: clamp(identityVerification),
    sellerDeclarationCompleteness: clamp(sellerDeclarationCompleteness),
    legalReadiness: clamp(legalReadiness),
    dataConsistency: clamp(dataConsistency),
  };

  return {
    breakdown,
    issues,
    strengths,
    issueCodes: [...new Set(issueCodes)],
    strengthCodes: [...new Set(strengthCodes)],
  };
}

/** TrustScoreRaw = weighted sum of component subscores (0–100). */
export function trustScoreRawWeighted(breakdown: TrustComponentBreakdown): number {
  const s =
    breakdown.addressValidity * W_RAW.addressValidity +
    breakdown.mediaQuality * W_RAW.mediaQuality +
    breakdown.identityVerification * W_RAW.identityVerification +
    breakdown.sellerDeclarationCompleteness * W_RAW.sellerDeclarationCompleteness +
    breakdown.legalReadiness * W_RAW.legalReadiness +
    breakdown.dataConsistency * W_RAW.dataConsistency;
  return clamp(s);
}
