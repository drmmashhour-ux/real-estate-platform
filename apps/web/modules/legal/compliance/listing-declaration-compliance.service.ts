/**
 * OACIQ-oriented seller declaration gate for marketplace publish and offers.
 *
 * **AI assist (safe boundaries)** — assistants may suggest wording for defects or help structure a declaration;
 * they must not auto-fill submissions, override a seller refusal, or conceal missing material facts.
 */

import { prisma } from "@/lib/db";
import { parseSellerDeclarationJson } from "@/lib/fsbo/seller-hub-validation";

export type ListingDeclarationComplianceInput =
  | null
  | undefined
  | { status: "missing" }
  | { status: "refused" }
  | { status: "complete" };

export type ListingDeclarationComplianceResult =
  | { allowed: true }
  | { allowed: true; warning: "SELLER_REFUSED_DECLARATION" }
  | { allowed: false; reason: "DECLARATION_MISSING" | "DECLARATION_INCOMPLETE" };

export function validateListingCompliance(
  declaration: ListingDeclarationComplianceInput
): ListingDeclarationComplianceResult {
  if (declaration == null) {
    return { allowed: false, reason: "DECLARATION_MISSING" };
  }
  if (declaration.status === "missing") {
    return { allowed: false, reason: "DECLARATION_INCOMPLETE" };
  }
  if (declaration.status === "refused") {
    return { allowed: true, warning: "SELLER_REFUSED_DECLARATION" };
  }
  return { allowed: true };
}

function isFsboDeclarationComplete(listing: {
  sellerDeclarationJson: unknown;
  sellerDeclarationCompletedAt: Date | null;
  propertyType?: string | null;
}): boolean {
  if (!listing.sellerDeclarationCompletedAt) return false;
  return parseSellerDeclarationJson(listing.sellerDeclarationJson, { propertyType: listing.propertyType }).ok;
}

/**
 * Normalize FSBO listing rows for `validateListingCompliance`.
 * - Explicit `compliance.sellerDeclarationStatus` or `sellerDeclarationStatus` / `sellerDeclarationRefused` on JSON.
 * - No / empty JSON → null (DECLARATION_MISSING).
 * - Partial JSON → { status: "missing" } (DECLARATION_INCOMPLETE).
 */
export function normalizeFsboDeclarationComplianceInput(listing: {
  sellerDeclarationJson: unknown;
  sellerDeclarationCompletedAt: Date | null;
  propertyType?: string | null;
}): ListingDeclarationComplianceInput {
  const j =
    listing.sellerDeclarationJson && typeof listing.sellerDeclarationJson === "object"
      ? (listing.sellerDeclarationJson as Record<string, unknown>)
      : null;
  const compliance =
    j?.compliance && typeof j.compliance === "object" ? (j.compliance as Record<string, unknown>) : null;
  const explicitStatus = compliance?.sellerDeclarationStatus ?? j?.sellerDeclarationStatus;
  if (explicitStatus === "refused" || j?.sellerDeclarationRefused === true) {
    return { status: "refused" };
  }
  if (explicitStatus === "missing") {
    return { status: "missing" };
  }
  if (isFsboDeclarationComplete(listing)) {
    return { status: "complete" };
  }
  const meaningfulKeys = j ? Object.keys(j).filter((k) => !["version", "meta"].includes(k)) : [];
  if (meaningfulKeys.length > 0) {
    return { status: "missing" };
  }
  return null;
}

/** Map `compliance_seller_declarations.status` + presence for CRM / DS linkage. */
function normalizeSellerDeclarationRow(row: { status: string } | null): ListingDeclarationComplianceInput {
  if (!row) return null;
  const s = row.status.toLowerCase();
  if (s === "refused") return { status: "refused" };
  if (s === "missing" || s === "incomplete" || s === "draft") return { status: "missing" };
  if (s === "recorded" || s === "complete" || s === "final") return { status: "complete" };
  return { status: "missing" };
}

/**
 * Resolve declaration gate input by marketplace listing id (FSBO id or CRM `Listing.id`).
 */
export async function loadListingDeclarationComplianceInput(
  listingId: string
): Promise<ListingDeclarationComplianceInput> {
  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      sellerDeclarationJson: true,
      sellerDeclarationCompletedAt: true,
      propertyType: true,
    },
  });
  if (fsbo) {
    return normalizeFsboDeclarationComplianceInput(fsbo);
  }

  const crm = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (crm) {
    const ds = await prisma.sellerDeclaration.findFirst({
      where: { listingId },
      orderBy: { updatedAt: "desc" },
      select: { status: true },
    });
    return normalizeSellerDeclarationRow(ds);
  }

  return null;
}

export function sellerRefusedDeclarationFromCompliance(
  result: ListingDeclarationComplianceResult
): boolean {
  return result.allowed === true && "warning" in result && result.warning === "SELLER_REFUSED_DECLARATION";
}
