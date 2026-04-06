import type { FsboListingDocument, FsboListingVerification, SellerSupportingDocument } from "@prisma/client";
import type { SellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import { missingDeclarationSections, type SellerDeclarationData } from "@/lib/fsbo/seller-declaration-schema";
import { parseSellerDeclarationJson } from "@/lib/fsbo/seller-hub-validation";
import { FSBO_HUB_REQUIRED_DOC_TYPES } from "@/lib/fsbo/seller-hub-doc-types";

export type ListingAiScoresResult = {
  riskScore: number;
  trustScore: number;
  reasons: string[];
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function hubRequiredDocsUploaded(docs: Pick<FsboListingDocument, "docType" | "fileUrl">[]): boolean {
  return FSBO_HUB_REQUIRED_DOC_TYPES.every((t) => {
    const row = docs.find((d) => d.docType === t);
    return Boolean(row?.fileUrl?.trim());
  });
}

function countMissingRequiredHubDocs(docs: Pick<FsboListingDocument, "docType" | "fileUrl">[]): number {
  return FSBO_HUB_REQUIRED_DOC_TYPES.filter((t) => {
    const row = docs.find((d) => d.docType === t);
    return !row?.fileUrl?.trim();
  }).length;
}

function supportingCount(
  docs: Pick<SellerSupportingDocument, "category" | "status">[],
  category: SellerSupportingDocument["category"]
): number {
  return docs.filter((d) => d.category === category && d.status !== "REJECTED").length;
}

function identityVerifiedForTrust(
  declaration: SellerDeclarationData,
  verification: FsboListingVerification | null | undefined
): boolean {
  if (verification?.identityStatus === "VERIFIED") return true;
  const sellers = declaration.sellers ?? [];
  if (sellers.length === 0) return false;
  return sellers.every((s) => s.idDocumentVerificationStatus === "verified");
}

/**
 * Risk: higher = more risky (0–100). Trust: higher = more trustworthy (0–100).
 * Uses declaration text, hub + supporting docs, verification, and rules-engine AI review.
 */
export function computeListingAiScores(params: {
  declaration: SellerDeclarationData;
  review: SellerDeclarationAiReview;
  hubDocuments: Pick<FsboListingDocument, "docType" | "fileUrl">[];
  supportingDocuments: Pick<SellerSupportingDocument, "category" | "status">[];
  verification: FsboListingVerification | null | undefined;
  sellerDeclarationJson: unknown;
  sellerDeclarationCompletedAt: Date | null;
  propertyType?: string | null;
}): ListingAiScoresResult {
  const {
    declaration,
    review,
    hubDocuments,
    supportingDocuments,
    verification,
    sellerDeclarationJson,
    sellerDeclarationCompletedAt,
    propertyType,
  } = params;

  const reasons: string[] = [];
  let risk = 0;

  const highHits = review.keywordsMatched.filter((k) => k.severity === "HIGH");
  for (const h of highHits) {
    risk += 20;
    reasons.push(`Risk factor: ${h.label} mentioned in declaration or listing text.`);
  }

  const medHits = review.keywordsMatched.filter((k) => k.severity === "MEDIUM");
  for (const h of medHits) {
    risk += 10;
    reasons.push(`Topic flagged: ${h.label} — review supporting documents.`);
  }

  const parsed = parseSellerDeclarationJson(sellerDeclarationJson, { propertyType });
  const missingSecs = missingDeclarationSections(declaration, propertyType);
  if (!parsed.ok || missingSecs.length > 0) {
    risk += 10;
    reasons.push("Incomplete disclosures: finish all required declaration sections.");
  }

  const missingHub = countMissingRequiredHubDocs(hubDocuments);
  if (missingHub > 0) {
    risk += 5;
    reasons.push("Missing required listing documents (ownership / ID).");
  }

  if (declaration.isCondo && supportingCount(supportingDocuments, "CONDO_DOCUMENTS") === 0) {
    risk += 10;
    reasons.push("Condo / divided co-ownership file lacks condo supporting documents.");
  }

  if (declaration.renovationInvoicesAvailable === true && supportingCount(supportingDocuments, "RENOVATION_INVOICES") === 0) {
    risk += 10;
    reasons.push("Renovation invoices were declared as available but are not uploaded.");
  }

  if (declaration.isNewConstruction && supportingCount(supportingDocuments, "CERTIFICATES_WARRANTIES") === 0) {
    risk += 10;
    reasons.push("New construction / warranty context lacks supporting certificate documents.");
  }

  const unclearSections = missingSecs.length;
  if (unclearSections >= 2) {
    risk += 5;
    reasons.push("Several declaration sections still open — answers may be unclear or incomplete.");
  } else if (declaration.additionalDeclarationsInsufficientKnowledge && declaration.additionalDeclarationsText.trim().length < 30) {
    risk += 5;
    reasons.push("“Insufficient knowledge” indicated — add a clearer explanation in Details & Additional Declarations.");
  }

  risk = clamp(risk, 0, 100);

  // Trust: start 100
  let trust = 100;
  const trustReasons: string[] = [];

  if (missingHub > 0) {
    trust -= 10;
    trustReasons.push("Required documents not yet uploaded.");
  }

  if (!parsed.ok || !sellerDeclarationCompletedAt) {
    trust -= 15;
    trustReasons.push("Seller declaration not fully completed.");
  }

  if (review.missingInformation.length > 0) {
    trust -= 20;
    trustReasons.push("Potential inconsistencies or missing supporting information flagged.");
  }

  if (declaration.isCondo && supportingCount(supportingDocuments, "CONDO_DOCUMENTS") > 0) {
    trust += 5;
    trustReasons.push("Condo supporting documents uploaded.");
  }

  if (declaration.renovationInvoicesAvailable === true && supportingCount(supportingDocuments, "RENOVATION_INVOICES") > 0) {
    trust += 5;
    trustReasons.push("Renovation evidence uploaded for declared work.");
  }

  const idOk = identityVerifiedForTrust(declaration, verification);
  if (!idOk) {
    trust -= 25;
    trustReasons.push("Identity not yet verified by the platform.");
  } else {
    trust += 10;
    trustReasons.push("Identity verified (or seller ID documents verified).");
  }

  if (hubRequiredDocsUploaded(hubDocuments)) {
    trust += 10;
    trustReasons.push("Required ownership and ID documents uploaded.");
  }

  const d15 = declaration.additionalDeclarationsHistory ?? [];
  const d15Detailed = d15.some((e) => e.text.trim().length >= 100);
  if (d15Detailed) {
    trust += 5;
    trustReasons.push("Detailed Additional Declarations (D15-style) entry on file.");
  }

  trust = clamp(trust, 0, 100);

  const mergedReasons = [...reasons, ...trustReasons.map((r) => `Trust: ${r}`)];
  return { riskScore: risk, trustScore: trust, reasons: mergedReasons.slice(0, 24) };
}

