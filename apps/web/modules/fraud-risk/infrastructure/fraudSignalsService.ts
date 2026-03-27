import type { FsboListing, FsboListingVerification } from "@prisma/client";
import { migrateLegacySellerDeclaration, declarationSectionCounts } from "@/lib/fsbo/seller-declaration-schema";
import { addressHasUnitNumber } from "@/modules/trust-score/infrastructure/trustNumericTables";
import type { FraudSignal } from "../domain/fraud.types";

export type ListingFraudContext = {
  listing: FsboListing & { verification: FsboListingVerification | null };
  duplicateImageListingIds: string[];
};

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Deterministic fraud-family subscores (0–100, higher = riskier) + trust penalty points.
 */
export function computeFraudFamilies(ctx: ListingFraudContext): {
  identityAnomaly: number;
  mediaReuseRisk: number;
  addressMismatchRisk: number;
  documentContradictionRisk: number;
  behavioralRisk: number;
  clusterRisk: number;
  signals: FraudSignal[];
  trustPenaltyPoints: number;
} {
  const { listing, duplicateImageListingIds } = ctx;
  const signals: FraudSignal[] = [];
  let trustPenaltyPoints = 0;

  const push = (s: FraudSignal, penalty: number) => {
    signals.push(s);
    trustPenaltyPoints += penalty;
  };

  const v = listing.verification;
  let identityAnomaly = 62;
  if (v?.identityStatus === "VERIFIED") identityAnomaly = 18;
  else if (v?.identityStatus === "PENDING") identityAnomaly = 44;

  if (listing.listingOwnerType === "BROKER") {
    identityAnomaly = Math.max(0, identityAnomaly - 8);
  }

  let mediaReuseRisk = 12;
  if (duplicateImageListingIds.length > 0) {
    mediaReuseRisk = 84;
    push(
      {
        code: "MEDIA_DUPLICATE_CROSS_LISTING",
        weightHint: mediaReuseRisk,
        message: `Same image URL appears on ${duplicateImageListingIds.length} other listing(s).`,
        safeSummary: "Duplicate media detected across listings — review gallery.",
      },
      0
    );
  }

  let addressMismatchRisk = 18;
  const addr = listing.address?.trim() ?? "";
  const city = listing.city?.trim() ?? "";
  const pt = (listing.propertyType ?? "").toUpperCase();
  const looksCondo = pt.includes("CONDO");

  if (addr.length < 4 || city.length < 2) {
    addressMismatchRisk = 90;
    push(
      {
        code: "ADDRESS_MALFORMED",
        weightHint: addressMismatchRisk,
        message: "Address or city is too thin to validate consistently.",
        safeSummary: "Address appears incomplete or malformed.",
      },
      0
    );
  }

  if (looksCondo && !addressHasUnitNumber(addr)) {
    addressMismatchRisk = Math.max(addressMismatchRisk, 70);
    push(
      {
        code: "CONDO_UNIT_MISSING",
        weightHint: 70,
        message: "Condo without clear unit number in address.",
        safeSummary: "Condo unit may be missing from address.",
      },
      0
    );
  }

  if (looksCondo && /house|maison unifamiliale/i.test(addr)) {
    addressMismatchRisk = Math.max(addressMismatchRisk, 82);
    push(
      {
        code: "ADDRESS_TYPE_MISMATCH",
        weightHint: 82,
        message: "Property type vs address wording conflict.",
        safeSummary: "Property type may not match address wording.",
      },
      0
    );
  }

  let documentContradictionRisk = 16;
  const raw = listing.sellerDeclarationAiReviewJson;
  if (raw && typeof raw === "object") {
    const o = raw as { detectedRisks?: { severity?: string }[] };
    const highs = o.detectedRisks?.filter((r) => r.severity === "HIGH").length ?? 0;
    if (highs > 0) {
      documentContradictionRisk = clamp(58 + highs * 10);
      push(
        {
          code: "DECLARATION_CONTRADICTION",
          weightHint: documentContradictionRisk,
          message: "Seller declaration review flagged high-severity inconsistencies.",
          safeSummary: "Declaration review flagged inconsistencies.",
        },
        0
      );
    }
  }

  const decl = migrateLegacySellerDeclaration(listing.sellerDeclarationJson);
  const { completed, total } = declarationSectionCounts(decl, listing.propertyType);
  let behavioralRisk = listing.priceCents <= 0 ? 52 : 24;
  if (total > 0 && completed / total < 0.35) {
    behavioralRisk = Math.max(behavioralRisk, 48);
  }

  const clusterRisk = 16;

  const tags = listing.photoTagsJson;
  const tagArr = Array.isArray(tags) ? tags.filter((x): x is string => typeof x === "string") : [];
  const hasExteriorTag = tagArr.some((t) => t.toUpperCase().includes("EXTERIOR"));
  const nImg = Array.isArray(listing.images) ? listing.images.length : 0;
  const publishLike = listing.status === "ACTIVE" || listing.status === "PENDING_VERIFICATION";
  if (publishLike && nImg > 0 && !hasExteriorTag) {
    push(
      {
        code: "MEDIA_EXTERIOR_MISSING_PUBLISH",
        weightHint: 44,
        message: "Active listing lacks a labeled exterior photo.",
        safeSummary: "Exterior photo labeling missing for a published listing.",
      },
      0
    );
  }

  return {
    identityAnomaly: clamp(identityAnomaly),
    mediaReuseRisk: clamp(mediaReuseRisk),
    addressMismatchRisk: clamp(addressMismatchRisk),
    documentContradictionRisk: clamp(documentContradictionRisk),
    behavioralRisk: clamp(behavioralRisk),
    clusterRisk: clamp(clusterRisk),
    signals,
    trustPenaltyPoints,
  };
}

export function aggregateFraudScore(families: {
  identityAnomaly: number;
  mediaReuseRisk: number;
  addressMismatchRisk: number;
  documentContradictionRisk: number;
  behavioralRisk: number;
  clusterRisk: number;
}): number {
  const s =
    0.25 * families.identityAnomaly +
    0.2 * families.mediaReuseRisk +
    0.15 * families.addressMismatchRisk +
    0.15 * families.documentContradictionRisk +
    0.15 * families.behavioralRisk +
    0.1 * families.clusterRisk;
  return clamp(s);
}

export function fraudRiskLevel(score: number): import("../domain/fraud.types").FraudRiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}
