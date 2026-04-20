/**
 * Seller-side disclosure / bad-faith heuristics — deterministic pattern checks only.
 */

import { legalFraudLog } from "./legal-logging";

export type SellerFraudAnalysisInput = {
  listingDescription: string;
  sellerDeclarationJson: unknown | null;
  inspectionNotes?: string | null;
  uploadedDocCategories?: string[];
  sameSellerHighRiskListingCount?: number;
};

export type SellerFraudAnalysisResult = {
  misrepresentationDelta: number;
  signals: string[];
  knownDefectNotDisclosed: boolean;
  silenceDuringInspection: boolean;
  vagueMaterialComponentWording: boolean;
  formDocContradiction: boolean;
  listingInspectionContradiction: boolean;
  recurringPattern: boolean;
};

function textHasYear(text: string): boolean {
  return /\b(19|20)\d{2}\b/.test(text);
}

function declarationSaysNoStructuralIssues(decl: Record<string, unknown> | null): boolean {
  if (!decl) return false;
  const defects = typeof decl.defects === "string" ? decl.defects.toLowerCase() : "";
  const structural = typeof decl.structuralIssues === "string" ? decl.structuralIssues.toLowerCase() : "";
  const combined = `${defects} ${structural}`.trim();
  if (!combined) return false;
  return /\b(no|none|without|aucun|rien)\b/i.test(combined) && combined.length < 400;
}

export function analyzeSellerDisclosureFraud(input: SellerFraudAnalysisInput): SellerFraudAnalysisResult {
  const desc = (input.listingDescription ?? "").trim();
  const inspection = (input.inspectionNotes ?? "").trim().toLowerCase();
  const signals: string[] = [];
  let delta = 0;

  const declObj =
    input.sellerDeclarationJson && typeof input.sellerDeclarationJson === "object"
      ? (input.sellerDeclarationJson as Record<string, unknown>)
      : null;

  let knownDefectNotDisclosed = false;
  if (declObj && declarationSaysNoStructuralIssues(declObj) && /\b(defect|issue|water|foundation|crack)\b/i.test(inspection)) {
    knownDefectNotDisclosed = true;
    delta += 35;
    signals.push("KNOWN_DEFECT_NON_DISCLOSURE_PATTERN");
  }

  let silenceDuringInspection = false;
  if (/\b(seller|vendor)\b.*\b(refus|silent|declin|no show)\b/i.test(inspection)) {
    silenceDuringInspection = true;
    delta += 40;
    signals.push("INSPECTION_SELLER_SILENCE");
  }

  let vagueMaterialComponentWording = false;
  const roofLine = /\b(roof|toiture|toit)\b/i.test(desc);
  const renovated = /\b(renovat|refait|rénov|new roof)\b/i.test(desc);
  if ((roofLine || renovated) && !textHasYear(desc)) {
    vagueMaterialComponentWording = true;
    delta += 18;
    signals.push("VAGUE_MATERIAL_COMPONENT_WORDING");
  }

  let formDocContradiction = false;
  const hasInspectionDoc = (input.uploadedDocCategories ?? []).some((c) =>
    /INSPECTION|RENovat|PERMIT/i.test(c),
  );
  if (renovated && !hasInspectionDoc) {
    formDocContradiction = true;
    delta += 15;
    signals.push("RENOVATION_CLAIM_WITHOUT_SUPPORTING_DOCS");
  }

  let listingInspectionContradiction = false;
  if (
    /\b(no|without|aucun)\b.*\b(issue|problem|defect)\b/i.test(desc) &&
    /\b(limited access|limited inspection|snow|not visible|concern)\b/i.test(inspection)
  ) {
    listingInspectionContradiction = true;
    delta += 22;
    signals.push("LISTING_VS_INSPECTION_NOTES_CONFLICT");
  }

  let recurringPattern = false;
  const repeat = input.sameSellerHighRiskListingCount ?? 0;
  if (repeat >= 2) {
    recurringPattern = true;
    delta += Math.min(30, repeat * 10);
    signals.push("RECURRING_HIGH_RISK_LISTING_PATTERN");
  }

  delta = Math.min(80, delta);

  if (signals.length) {
    legalFraudLog("seller fraud analysis", { signalCount: signals.length, delta });
  }

  return {
    misrepresentationDelta: delta,
    signals,
    knownDefectNotDisclosed,
    silenceDuringInspection,
    vagueMaterialComponentWording,
    formDocContradiction,
    listingInspectionContradiction,
    recurringPattern,
  };
}
