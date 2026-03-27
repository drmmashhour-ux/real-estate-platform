import type { FsboListing, FsboListingVerification } from "@prisma/client";
import { migrateLegacySellerDeclaration, declarationSectionCounts } from "@/lib/fsbo/seller-declaration-schema";

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Condo / apartment unit indicator in free-text address */
export function addressHasUnitNumber(addr: string): boolean {
  const a = addr.trim();
  if (!a) return false;
  if (/#\s*\d+/i.test(a)) return true;
  if (/\b(apt|apartment|suite|unit|local)\s*[0-9]/i.test(a)) return true;
  if (/\b\d{1,4}\s*-\s*\d{1,4}\b/.test(a)) return true;
  return false;
}

export type TrustNumericContext = {
  listing: FsboListing & { verification: FsboListingVerification | null };
  images: string[];
  tagArr: string[];
  /** Same image URL used on another listing */
  hasDuplicateImagesAcrossListings: boolean;
};

/** § Address Validity — table 0–100 */
export function scoreAddressValidity(ctx: TrustNumericContext): number {
  const addr = ctx.listing.address?.trim() ?? "";
  const city = ctx.listing.city?.trim() ?? "";
  const pt = (ctx.listing.propertyType ?? "").toUpperCase();
  const looksCondo = pt.includes("CONDO");

  if (addr.length < 3 || city.length < 2) return 0;

  if (looksCondo && /house|maison unifamiliale/i.test(addr)) return 50;

  if (looksCondo && !addressHasUnitNumber(addr)) return 80;

  if (addr.length >= 12 && city.length >= 2) return 100;

  return 80;
}

/** § Media Quality — table + extra penalties (duplicate −10, irrelevant −8) */
export function scoreMediaQuality(ctx: TrustNumericContext): number {
  const n = ctx.images.length;
  const tagArr = ctx.tagArr;
  const hasExterior = tagArr.some((t) => t.toUpperCase().includes("EXTERIOR"));
  const hasInterior = tagArr.some((t) => t.toUpperCase().includes("INTERIOR"));

  let base: number;
  if (n === 0) base = 0;
  else if (n <= 2) base = 40;
  else if (n <= 4) base = hasExterior ? 80 : 70;
  else {
    base = hasExterior && hasInterior ? 100 : 70;
  }

  let s = base;
  if (ctx.hasDuplicateImagesAcrossListings) s -= 10;
  if (ctx.images.some((u) => /\.pdf(\?|$)/i.test(u.trim()))) s -= 8;

  return clamp(s);
}

/** § Identity Verification */
export function scoreIdentityVerification(listing: TrustNumericContext["listing"]): number {
  const v = listing.verification;
  const broker = listing.listingOwnerType === "BROKER";
  if (v?.identityStatus === "VERIFIED" && broker) return 100;
  if (v?.identityStatus === "VERIFIED") return 80;
  if (v?.identityStatus === "PENDING") return 50;
  return 0;
}

/** § Seller Declaration — completion table + −10 per contradiction (HIGH severity) */
export function scoreSellerDeclaration(listing: TrustNumericContext["listing"]): number {
  const decl = migrateLegacySellerDeclaration(listing.sellerDeclarationJson);
  const { completed, total } = declarationSectionCounts(decl, listing.propertyType);

  const raw = listing.sellerDeclarationAiReviewJson;
  let highs = 0;
  if (raw && typeof raw === "object") {
    const o = raw as { detectedRisks?: { severity?: string }[] };
    highs = o.detectedRisks?.filter((r) => r.severity === "HIGH").length ?? 0;
  }

  if (listing.sellerDeclarationCompletedAt) {
    return clamp(100 - 10 * highs);
  }

  if (total <= 0) return 0;

  const pct = (100 * completed) / total;
  let s: number;
  if (pct >= 90) s = 100;
  else if (pct >= 70) s = 75;
  else if (pct >= 40) s = 50;
  else s = 20;

  s -= 10 * highs;

  return clamp(s);
}

/** § Legal / Risk — from listing risk snapshot */
export function scoreLegalReadiness(riskScore: number | null | undefined): number {
  if (riskScore == null) return 40;
  if (riskScore <= 25) return 100;
  if (riskScore <= 45) return 70;
  if (riskScore <= 65) return 40;
  return 0;
}

/** § Data Consistency */
export function scoreDataConsistency(listing: TrustNumericContext["listing"]): number {
  const price = listing.priceCents / 100;
  const sq = listing.surfaceSqft ?? 0;
  const beds = listing.bedrooms ?? 0;

  if (beds < 0 || beds > 8) return 0;

  if (price > 0 && sq > 100) {
    const ppsf = price / sq;
    if (ppsf > 2000 || ppsf < 80) return 0;
    if (ppsf > 1600 || ppsf < 120) return 50;
    if (ppsf > 1300 || ppsf < 200) return 75;
  }

  if (price > 0 && beds > 0 && sq > 400) return 100;

  if (price > 0 && sq > 100) return 100;

  return 75;
}
