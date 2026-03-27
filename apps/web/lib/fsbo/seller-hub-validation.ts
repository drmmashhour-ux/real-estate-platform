import type { FsboListing, FsboListingDocument } from "@prisma/client";
import { assertFsboContractsSignedForActivation } from "@/lib/contracts/fsbo-seller-contracts";
import { FSBO_HUB_REQUIRED_DOC_TYPES, type FsboHubDocType } from "@/lib/fsbo/seller-hub-doc-types";
import {
  isAdditionalDeclarationsSectionComplete,
  isIdentityDeclarationComplete,
  isPartyIdentityComplete,
  migrateLegacySellerDeclaration,
  missingDeclarationSections,
  SELLER_DECLARATION_VERSION,
  syncSellerFullNameFromParties,
  type SellerDeclarationData,
} from "@/lib/fsbo/seller-declaration-schema";
import { validateSellerDeclarationIntegrity } from "@/lib/fsbo/seller-declaration-validation";

/** @deprecated Legacy 6-field shape — migrated for display only */
export type SellerDeclarationPayload = {
  propertyCondition: string;
  knownDefects: string;
  renovations: string;
  legalStatus: string;
  inclusions: string;
  exclusions: string;
};

const MIN_LEN = 2;

function nonEmpty(s: unknown, min = MIN_LEN): boolean {
  return typeof s === "string" && s.trim().length >= min;
}

function parseSellerDeclarationV2(
  raw: unknown,
  propertyType: string | null | undefined
): { ok: true; data: SellerDeclarationData } | { ok: false; error: string } {
  const d = syncSellerFullNameFromParties(migrateLegacySellerDeclaration(raw ?? null));
  if (d.version !== SELLER_DECLARATION_VERSION) {
    return { ok: false, error: "Complete the full seller declaration (all sections)." };
  }

  if (!isIdentityDeclarationComplete(d, propertyType)) {
    const buyers = d.buyers ?? [];
    if (buyers.length > 0 && !buyers.every((b) => isPartyIdentityComplete(b))) {
      return {
        ok: false,
        error: "Complete identity for each buyer you listed (ID fields and document upload).",
      };
    }
    const v = validateSellerDeclarationIntegrity(d, propertyType);
    return {
      ok: false,
      error: v.errors[0] ?? "Complete identity & authority (structured address, unique IDs, contact rules).",
    };
  }

  if (!d.conflictInterestDisclosureConfirmed) {
    return { ok: false, error: "Confirm conflict-of-interest disclosure (checkbox)." };
  }

  if (!d.propertyDescriptionAccurate || !nonEmpty(d.propertyDescriptionNotes, 10)) {
    return { ok: false, error: "Confirm property description accuracy and add notes." };
  }

  if (!nonEmpty(d.includedItems) || !nonEmpty(d.excludedItems)) {
    return { ok: false, error: "Complete inclusions and exclusions." };
  }

  if (!nonEmpty(d.knownDefects) || !nonEmpty(d.pastIssues) || !nonEmpty(d.structuralConcerns)) {
    return { ok: false, error: "Complete property condition (defects, past issues, structural)." };
  }

  if (!nonEmpty(d.renovationsDetail) || d.renovationInvoicesAvailable === null) {
    return { ok: false, error: "Describe renovations and whether invoices are available." };
  }

  if (d.poolExists === null) {
    return { ok: false, error: "Answer the swimming pool section (no pool vs pool details)." };
  }

  if (d.poolExists === true) {
    if (!nonEmpty(d.poolType) || !nonEmpty(d.poolSafetyCompliance)) {
      return { ok: false, error: "Complete pool type and safety compliance, or select no pool." };
    }
  }

  if (!d.buyerInspectionAccepted) {
    return { ok: false, error: "Accept that the buyer may conduct inspections." };
  }

  if (d.isCondo) {
    if (!d.condoSyndicateDocumentsAvailable || !d.condoFinancialStatementsAvailable || !d.condoRulesReviewed) {
      return { ok: false, error: "Confirm condo / syndicate documents (section 9)." };
    }
  }

  if (d.isNewConstruction) {
    if (!nonEmpty(d.gcrWarrantyDetails) || !nonEmpty(d.builderNameContact)) {
      return { ok: false, error: "Complete new construction / GCR and builder details." };
    }
  }

  if (!d.municipalSchoolTaxAcknowledged) {
    return { ok: false, error: "Acknowledge municipal and school tax disclosure (section 11)." };
  }

  if (!isAdditionalDeclarationsSectionComplete(d)) {
    return {
      ok: false,
      error:
        "Additional declarations are required to ensure full transparency: complete section 12 (save at least one entry with the required text and legal confirmation).",
    };
  }

  if (!d.informationCompleteAndAccurate || !d.platformNotLawyerOrInspectorAck) {
    return { ok: false, error: "Complete final confirmations (section 13)." };
  }

  return {
    ok: true,
    data: {
      ...d,
      version: SELLER_DECLARATION_VERSION,
    },
  };
}

/**
 * Validates seller declaration JSON for publish / mark complete.
 */
export function parseSellerDeclarationJson(
  raw: unknown,
  options?: { propertyType?: string | null }
): { ok: true; data: SellerDeclarationData } | { ok: false; error: string } {
  const v2 = parseSellerDeclarationV2(raw, options?.propertyType);
  if (v2.ok) return v2;

  /** Legacy 6-field — no longer sufficient for completion */
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: v2.error };
  }
  const o = raw as Record<string, unknown>;
  const legacyFields: (keyof SellerDeclarationPayload)[] = [
    "propertyCondition",
    "knownDefects",
    "renovations",
    "legalStatus",
    "inclusions",
    "exclusions",
  ];
  const legacyOk = legacyFields.every((k) => nonEmpty(o[k]));
  if (legacyOk) {
    return {
      ok: false,
      error:
        "Your declaration uses an older format. Please complete all sections in the updated OACIQ-style declaration.",
    };
  }
  return { ok: false, error: v2.error };
}

export function isSellerDeclarationComplete(listing: {
  sellerDeclarationJson: unknown;
  sellerDeclarationCompletedAt: Date | null;
  propertyType?: string | null;
}): boolean {
  if (!listing.sellerDeclarationCompletedAt) return false;
  return parseSellerDeclarationJson(listing.sellerDeclarationJson, { propertyType: listing.propertyType }).ok;
}

export function hubDocumentsSatisfied(docs: Pick<FsboListingDocument, "docType" | "fileUrl" | "status">[]): {
  ok: boolean;
  missing: FsboHubDocType[];
} {
  const byType = new Map(docs.map((d) => [d.docType, d]));
  const missing: FsboHubDocType[] = [];
  for (const t of FSBO_HUB_REQUIRED_DOC_TYPES) {
    const row = byType.get(t);
    const ok = Boolean(row?.fileUrl?.trim()) || row?.status === "uploaded" || row?.status === "approved";
    if (!ok) missing.push(t);
  }
  return { ok: missing.length === 0, missing };
}

export async function assertSellerHubSubmitReady(
  listing: FsboListing,
  documents: FsboListingDocument[]
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const errors: string[] = [];

  if (!listing.title?.trim() || listing.title === "Draft listing") {
    errors.push("Add a listing title.");
  }
  if (!listing.description?.trim() || listing.description.includes("Complete your listing in Seller Hub")) {
    errors.push("Add a property description.");
  }
  if (!listing.priceCents || listing.priceCents < 1_000) {
    errors.push("Set a valid price.");
  }
  if (!listing.address?.trim() || listing.address === "TBD") {
    errors.push("Add a street address.");
  }
  if (!listing.city?.trim() || listing.city === "TBD") {
    errors.push("Add a city.");
  }
  if (!listing.cadastreNumber?.trim()) {
    errors.push("Cadastre / lot number is required.");
  }
  if (!listing.images?.length) {
    errors.push("Upload at least one property photo.");
  }

  // Photo tagging & confirmation (pre-publish requirement)
  const tagsRaw = listing.photoTagsJson;
  const tags: string[] = Array.isArray(tagsRaw) ? tagsRaw.filter((t): t is string => typeof t === "string") : [];
  const photoCount = Array.isArray(listing.images) ? listing.images.length : 0;
  const allowedTags = ["EXTERIOR", "INTERIOR", "STREET_VIEW", "OTHER"];
  if (photoCount > 0) {
    if (tags.length !== photoCount) {
      errors.push("Tag each photo with its type (and keep the order aligned with the gallery).");
    } else {
      if (tags[0] !== "EXTERIOR") {
        errors.push("First photo must be tagged as Exterior.");
      }
      const invalid = tags.find((t) => !allowedTags.includes(t));
      if (invalid) {
        errors.push("One or more photo tags are invalid. Please re-select the photo type.");
      }
    }
  }

  if (!listing.photoConfirmationAcceptedAt) {
    errors.push("Confirm uploaded photos represent the actual property before submitting.");
  }

  if (!isSellerDeclarationComplete(listing)) {
    const parsed = parseSellerDeclarationJson(listing.sellerDeclarationJson, { propertyType: listing.propertyType });
    if (!parsed.ok) {
      errors.push(parsed.error);
    }
    const partial = migrateLegacySellerDeclaration(listing.sellerDeclarationJson);
    const missing = missingDeclarationSections(partial, listing.propertyType);
    if (missing.length > 0) {
      errors.push(`Incomplete declaration sections: ${missing.join(", ")}.`);
    }
  }

  const docCheck = hubDocumentsSatisfied(documents);
  if (!docCheck.ok) {
    errors.push(`Upload required documents: ${docCheck.missing.join(", ")}.`);
  }

  const contracts = await assertFsboContractsSignedForActivation(listing.id);
  if (!contracts.ok) {
    errors.push(
      contracts.code === "missing" || contracts.code === "unsigned"
        ? "Sign the seller agreement and platform terms for this listing."
        : "A required contract must be accepted before submission."
    );
  }

  if (!listing.legalAccuracyAcceptedAt) {
    errors.push("Confirm the seller declaration and accuracy of your listing information (Review step).");
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

export {
  emptySellerDeclaration,
  migrateLegacySellerDeclaration,
  declarationCompletionPercent,
  missingDeclarationSections,
} from "@/lib/fsbo/seller-declaration-schema";
