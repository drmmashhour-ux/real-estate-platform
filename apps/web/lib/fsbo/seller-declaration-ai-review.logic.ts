import type { FsboListingDocument, SellerSupportingDocument } from "@prisma/client";
import type { SellerDeclarationData } from "@/lib/fsbo/seller-declaration-schema";
import { validateSellerDeclarationIntegrity } from "@/lib/fsbo/seller-declaration-validation";

export const SELLER_DECLARATION_AI_REVIEW_VERSION = 1 as const;

export type KeywordHit = {
  keyword: string;
  severity: "HIGH" | "MEDIUM";
  label: string;
};

export type SellerDeclarationAiReview = {
  version: typeof SELLER_DECLARATION_AI_REVIEW_VERSION;
  analyzedAt: string;
  source: "rules_engine";
  keywordsMatched: KeywordHit[];
  detectedRisks: { severity: "HIGH" | "MEDIUM"; message: string }[];
  missingInformation: string[];
  suggestions: string[];
  hasHighRisk: boolean;
  /** Reserved for future ML / user acknowledgment flows */
  userCorrections?: { at: string; note: string }[];
};

const HIGH_PATTERNS: { re: RegExp; keyword: string; label: string }[] = [
  { re: /\bfire\b/i, keyword: "fire", label: "Fire" },
  { re: /\b(flood|flooding|flood(?:ing)?|water damage|water-damage)\b/i, keyword: "flooding", label: "Flooding / water damage" },
  { re: /\bsewer\s*backup\b/i, keyword: "sewer backup", label: "Sewer backup" },
  { re: /\b(infest|rodent|termite|vermin)\b/i, keyword: "infestation", label: "Infestation" },
  { re: /\bmold\b/i, keyword: "mold", label: "Mold" },
  { re: /\basbestos\b/i, keyword: "asbestos", label: "Asbestos" },
  { re: /\bstructural\s*damage\b/i, keyword: "structural damage", label: "Structural damage" },
  { re: /\b(foundation|foundations)\b.*\b(issue|problem|crack)\b/i, keyword: "foundation issue", label: "Foundation issue" },
  { re: /\b(cannabis|marijuana|grow[\s-]*op|drug)\b/i, keyword: "cannabis/drug", label: "Cannabis / drug activity" },
  { re: /\bdeath\s+(?:in|on|at)\s+(?:the\s+)?(?:property|premises|home|house)\b/i, keyword: "death in property", label: "Death in property" },
  { re: /\b(died|death)\b.*\b(property|home|house|unit)\b/i, keyword: "death in property", label: "Death in property" },
];

const MEDIUM_PATTERNS: { re: RegExp; keyword: string; label: string }[] = [
  { re: /\brenovation\b.*\b(no\s+permit|without\s+permit|unpermitted)\b/i, keyword: "renovation without permit", label: "Renovation without permit" },
  { re: /\b(permit|unpermitted)\b.*\brenovation\b/i, keyword: "renovation without permit", label: "Renovation without permit" },
  { re: /\bdispute\b/i, keyword: "dispute", label: "Dispute" },
  { re: /\binsurance\s*claim\b/i, keyword: "insurance claim", label: "Insurance claim" },
  { re: /\b(previous|past)\s+damage\b.*\b(repair|repaired)\b/i, keyword: "previous damage repaired", label: "Previous damage repaired" },
];

function gatherDeclarationText(d: SellerDeclarationData): string {
  const parts: string[] = [];
  const push = (s: unknown) => {
    if (typeof s === "string" && s.trim()) parts.push(s);
  };
  push(d.identityNotes);
  push(d.propertyDescriptionNotes);
  push(d.includedItems);
  push(d.excludedItems);
  push(d.knownDefects);
  push(d.pastIssues);
  push(d.structuralConcerns);
  push(d.renovationsDetail);
  push(d.poolType);
  push(d.poolSafetyCompliance);
  push(d.condoContingencyFundDetails);
  push(d.condoSpecialAssessmentDetails);
  push(d.condoCommonServicesNotes);
  push(d.gcrWarrantyDetails);
  push(d.builderNameContact);
  push(d.gstQstNotes);
  for (const e of d.additionalDeclarationsHistory ?? []) {
    push(e.text);
  }
  push(d.additionalDeclarationsText);
  return parts.join("\n").toLowerCase();
}

function scanKeywords(blob: string, description: string): { hits: KeywordHit[]; risks: SellerDeclarationAiReview["detectedRisks"] } {
  const combined = `${blob}\n${description}`.toLowerCase();
  const hits: KeywordHit[] = [];
  const seen = new Set<string>();
  const risks: SellerDeclarationAiReview["detectedRisks"] = [];

  for (const { re, keyword, label } of HIGH_PATTERNS) {
    if (re.test(combined) && !seen.has(`H:${keyword}`)) {
      seen.add(`H:${keyword}`);
      hits.push({ keyword, severity: "HIGH", label });
      risks.push({ severity: "HIGH", message: `${label} mentioned — review disclosure carefully.` });
    }
  }
  for (const { re, keyword, label } of MEDIUM_PATTERNS) {
    if (re.test(combined) && !seen.has(`M:${keyword}`)) {
      seen.add(`M:${keyword}`);
      hits.push({ keyword, severity: "MEDIUM", label });
      risks.push({ severity: "MEDIUM", message: `${label} mentioned — consider supporting documentation.` });
    }
  }
  return { hits, risks };
}

function hasNoIssuesClaim(text: string): boolean {
  const t = text.trim();
  if (t.length < 3) return false;
  return /\b(no|none|n\/a|aucun|rien|without)\b.*\b(issue|defect|problem|damage|known)\b/i.test(t) || /\b(no known|none known)\b/i.test(t);
}

function analyzeMissingAndInconsistencies(
  d: SellerDeclarationData,
  description: string,
  hubDocs: Pick<FsboListingDocument, "docType" | "fileUrl">[],
  supporting: Pick<SellerSupportingDocument, "category">[]
): { missing: string[]; suggestions: string[] } {
  const missing: string[] = [];
  const suggestions: string[] = [];

  const hasSupportingCategory = (cat: SellerSupportingDocument["category"]) =>
    supporting.some((s) => s.category === cat);

  const blob = `${gatherDeclarationText(d)}\n${description}`;
  const past = `${d.pastIssues}\n${d.knownDefects}\n${d.structuralConcerns}`;

  if (d.renovationInvoicesAvailable === true && d.renovationsDetail?.trim() && !hasSupportingCategory("RENOVATION_INVOICES")) {
    missing.push("Potential missing disclosure: renovations declared with invoices expected, but no renovation invoice uploaded in your document library.");
  }

  if (d.isCondo && !hasSupportingCategory("CONDO_DOCUMENTS")) {
    missing.push("Potential missing disclosure: condo / co-ownership file has no condo document uploaded in the seller document library.");
  }

  if (d.isNewConstruction && !hasSupportingCategory("CERTIFICATES_WARRANTIES")) {
    missing.push("Potential missing disclosure: new construction / warranty context is declared, but no warranty or builder document is uploaded.");
  }

  if (d.buyerInspectionAccepted && !hasSupportingCategory("INSPECTION_REPORT")) {
    missing.push("Potential missing disclosure: no inspection report found in uploaded seller documents (optional but recommended if you have one).");
  }

  if (hasNoIssuesClaim(past) && (hasSupportingCategory("RENOVATION_INVOICES") || hasSupportingCategory("CERTIFICATES_WARRANTIES"))) {
    missing.push("Potential inconsistency: condition fields suggest “no issues” while repair/invoice-type documents are uploaded — ensure narrative matches uploads.");
  }

  const d15 = d.additionalDeclarationsHistory ?? [];
  if (d15.length === 0 && /\b(flood|fire|mold|asbestos|foundation|infest)\b/i.test(blob)) {
    missing.push("Potential missing disclosure: Details & Additional Declarations (section 12) has no saved entry while sensitive topics appear elsewhere — add a clarifying entry.");
  }

  if (missing.length > 0) {
    suggestions.push("Add more detail in the declaration where gaps are flagged.");
    suggestions.push("Upload supporting documents (invoices, reports, permits) in Seller Hub → Documents.");
  }
  if (suggestions.length === 0 && missing.length === 0) {
    suggestions.push("Keep disclosures updated if anything material changes before closing.");
  }

  return { missing, suggestions };
}

export function analyzeSellerDeclarationForReview(params: {
  declaration: SellerDeclarationData;
  listingDescription: string;
  hubDocuments: Pick<FsboListingDocument, "docType" | "fileUrl">[];
  supportingDocuments: Pick<SellerSupportingDocument, "category">[];
  propertyType?: string | null;
}): SellerDeclarationAiReview {
  const { declaration, listingDescription, hubDocuments, supportingDocuments, propertyType } = params;
  const textBlob = gatherDeclarationText(declaration);
  const { hits, risks } = scanKeywords(textBlob, listingDescription);
  const { missing, suggestions } = analyzeMissingAndInconsistencies(
    declaration,
    listingDescription,
    hubDocuments,
    supportingDocuments
  );

  const integrity = validateSellerDeclarationIntegrity(declaration, propertyType);
  const missingMerged = [
    ...missing,
    ...integrity.verifyPrompts,
    ...integrity.warnings.map((w) => `Please verify: ${w}`),
  ];

  const hasHighRisk = hits.some((h) => h.severity === "HIGH") || risks.some((r) => r.severity === "HIGH");

  return {
    version: SELLER_DECLARATION_AI_REVIEW_VERSION,
    analyzedAt: new Date().toISOString(),
    source: "rules_engine",
    keywordsMatched: hits,
    detectedRisks: risks,
    missingInformation: missingMerged,
    suggestions,
    hasHighRisk,
    userCorrections: [],
  };
}

export function parseSellerDeclarationAiReview(raw: unknown): SellerDeclarationAiReview | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== SELLER_DECLARATION_AI_REVIEW_VERSION) return null;
  return raw as SellerDeclarationAiReview;
}
