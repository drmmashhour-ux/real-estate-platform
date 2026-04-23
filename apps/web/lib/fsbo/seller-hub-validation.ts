import type { FsboListing, FsboListingDocument, SellerSupportingDocument } from "@prisma/client";
import { assertFsboContractsSignedForActivation } from "@/lib/contracts/fsbo-seller-contracts";
import { FSBO_HUB_REQUIRED_DOC_TYPES, type FsboHubDocType } from "@/lib/fsbo/seller-hub-doc-types";
import {
  DECLARATION_SECTIONS_WITH_APPLICABILITY_GATE,
  effectiveSectionApplies,
  isAdditionalDeclarationsSectionComplete,
  isIdentityDeclarationComplete,
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

  const pt = (propertyType ?? "").toUpperCase();
  const listingIsCondo = pt === "CONDO";
  if (listingIsCondo && !d.isCondo) {
    return {
      ok: false,
      error:
        "This listing is a condominium — enable divided co-ownership in the declaration (section 9) and use photos that show your condo unit or building.",
    };
  }
  if (pt && !listingIsCondo && d.isCondo) {
    return {
      ok: false,
      error:
        "Your declaration indicates condo / divided co-ownership, but the listing type is not condominium. Update the property type (step 2) or adjust the declaration before marking complete.",
    };
  }

  if (!isIdentityDeclarationComplete(d, propertyType)) {
    const v = validateSellerDeclarationIntegrity(d, propertyType);
    return {
      ok: false,
      error: v.errors[0] ?? "Complete identity & authority (structured address, unique IDs, contact rules).",
    };
  }

  if (d.sectionApplies !== undefined) {
    for (const id of DECLARATION_SECTIONS_WITH_APPLICABILITY_GATE) {
      if (id === "condo" && listingIsCondo) continue;
      if (effectiveSectionApplies(d, id, propertyType) === null) {
        return {
          ok: false,
          error:
            "Choose Yes or No for each declaration section (sections 2–12) before marking the declaration complete.",
        };
      }
    }
  }

  if (effectiveSectionApplies(d, "conflict", propertyType) === true) {
    if (!d.conflictInterestDisclosureConfirmed) {
      return { ok: false, error: "Confirm conflict-of-interest disclosure (checkbox)." };
    }
  }

  if (effectiveSectionApplies(d, "description", propertyType) === true) {
    if (!d.propertyDescriptionAccurate || !nonEmpty(d.propertyDescriptionNotes, 10)) {
      return { ok: false, error: "Confirm property description accuracy and add notes." };
    }
  }

  if (effectiveSectionApplies(d, "inclusions", propertyType) === true) {
    if (!nonEmpty(d.includedItems) || !nonEmpty(d.excludedItems)) {
      return { ok: false, error: "Complete inclusions and exclusions." };
    }
  }

  if (effectiveSectionApplies(d, "condition", propertyType) === true) {
    if (!nonEmpty(d.knownDefects) || !nonEmpty(d.pastIssues) || !nonEmpty(d.structuralConcerns)) {
      return { ok: false, error: "Complete property condition (defects, past issues, structural)." };
    }
  }

  if (effectiveSectionApplies(d, "renovations", propertyType) === true) {
    if (!nonEmpty(d.renovationsDetail) || d.renovationInvoicesAvailable === null) {
      return { ok: false, error: "Describe renovations and whether invoices are available." };
    }
  }

  if (effectiveSectionApplies(d, "pool", propertyType) === true) {
    if (d.poolExists === null) {
      return { ok: false, error: "Answer the swimming pool section (no pool vs pool details)." };
    }
    if (d.poolExists === true) {
      if (!nonEmpty(d.poolType) || !nonEmpty(d.poolSafetyCompliance)) {
        return { ok: false, error: "Complete pool type and safety compliance, or select no pool." };
      }
    }
  }

  if (effectiveSectionApplies(d, "inspection", propertyType) === true) {
    if (!d.buyerInspectionAccepted) {
      return { ok: false, error: "Accept that the buyer may conduct inspections." };
    }
  }

  if (effectiveSectionApplies(d, "condo", propertyType) === true && d.isCondo) {
    if (
      !d.condoSyndicateDocumentsAvailable ||
      !d.condoFinancialStatementsAvailable ||
      !d.condoRulesReviewed ||
      !nonEmpty(d.condoContingencyFundDetails, 12)
    ) {
      return { ok: false, error: "Confirm condo / syndicate documents (section 9)." };
    }
  }

  if (effectiveSectionApplies(d, "newConstruction", propertyType) === true && d.isNewConstruction) {
    if (!nonEmpty(d.gcrWarrantyDetails) || !nonEmpty(d.builderNameContact)) {
      return { ok: false, error: "Complete new construction / GCR and builder details." };
    }
  }

  if (effectiveSectionApplies(d, "taxes", propertyType) === true) {
    if (!d.municipalSchoolTaxAcknowledged) {
      return { ok: false, error: "Acknowledge municipal and school tax disclosure (section 11)." };
    }
  }

  if (effectiveSectionApplies(d, "additionalDeclarations", propertyType) === true) {
    if (!isAdditionalDeclarationsSectionComplete(d)) {
      return {
        ok: false,
        error:
          "Additional declarations are required to ensure full transparency: complete section 12 (save at least one entry with the required text and legal confirmation).",
      };
    }
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

function supportingCategoryCount(
  docs: Pick<SellerSupportingDocument, "category" | "status">[],
  category: SellerSupportingDocument["category"]
): number {
  return docs.filter((d) => d.category === category && d.status !== "REJECTED").length;
}

function supportingDocumentGate(args: {
  listing: FsboListing;
  supportingDocuments: Pick<SellerSupportingDocument, "category" | "status" | "declarationSectionKey">[];
}): string[] {
  const declaration = syncSellerFullNameFromParties(migrateLegacySellerDeclaration(args.listing.sellerDeclarationJson ?? null));
  const docs = args.supportingDocuments;
  const errors: string[] = [];

  if (declaration.isCondo && supportingCategoryCount(docs, "CONDO_DOCUMENTS") < 1) {
    errors.push("Upload condo / co-ownership supporting documents before approval (minutes, financials, bylaws, or equivalent).");
  }

  if (declaration.renovationInvoicesAvailable === true && supportingCategoryCount(docs, "RENOVATION_INVOICES") < 1) {
    errors.push("Upload renovation invoices or proof of work because the declaration says invoices are available.");
  }

  if (declaration.isNewConstruction && supportingCategoryCount(docs, "CERTIFICATES_WARRANTIES") < 1) {
    errors.push("Upload warranty or builder certificate documents for new construction / GCR context.");
  }

  const sensitiveNarrative = [
    declaration.knownDefects,
    declaration.pastIssues,
    declaration.structuralConcerns,
    declaration.additionalDeclarationsText,
    ...(declaration.additionalDeclarationsHistory ?? []).map((entry) => entry.text),
  ]
    .join("\n")
    .toLowerCase();

  if (
    /\b(flood|water|fire|mold|asbestos|foundation|structural|dispute|insurance claim|special assessment)\b/.test(
      sensitiveNarrative
    ) &&
    docs.filter((d) => d.status !== "REJECTED").length < 1
  ) {
    errors.push("Upload at least one supporting document for the issues or clarifications disclosed in the declaration before approval.");
  }

  return errors;
}

export async function assertSellerHubSubmitReady(
  listing: FsboListing,
  documents: Pick<FsboListingDocument, "docType" | "fileUrl" | "status">[],
  supportingDocuments: Pick<SellerSupportingDocument, "category" | "status" | "declarationSectionKey">[] = []
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

  const { validateListingCompliance, normalizeFsboDeclarationComplianceInput } = await import(
    "@/modules/legal/compliance/listing-declaration-compliance.service"
  );
  const declNorm = normalizeFsboDeclarationComplianceInput(listing);
  const declCompliance = validateListingCompliance(declNorm);
  if (!declCompliance.allowed) {
    if (declCompliance.reason === "DECLARATION_MISSING") {
      errors.push("Seller declaration is required before publishing this listing.");
    } else {
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
    }
  }

  const docCheck = hubDocumentsSatisfied(documents);
  if (!docCheck.ok) {
    errors.push(`Upload required documents: ${docCheck.missing.join(", ")}.`);
  }
  errors.push(...supportingDocumentGate({ listing, supportingDocuments }));

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
