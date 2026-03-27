/**
 * Identity resolution: determine if two records refer to the same real-world entity.
 * Outcomes: exact_match | probable_match | manual_review_required | mismatch.
 */

import { normalizeLegalName, normalizeOrganizationName } from "./normalize";
import type { ResolutionOutcome } from "./types";

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export interface OwnerResolutionInput {
  legalName: string;
  /** Optional: land register or document-derived owner name for comparison */
  documentOwnerName?: string | null;
  /** Optional: existing normalized name to compare against */
  existingNormalizedName?: string | null;
}

/**
 * Resolve owner identity: compare legal name (and optional document name) to existing normalized name.
 */
export function resolveOwnerIdentity(input: OwnerResolutionInput): {
  outcome: ResolutionOutcome;
  confidence: number;
  reasons: string[];
} {
  const normalized = normalizeLegalName(input.legalName);
  const reasons: string[] = [];
  if (!normalized) {
    return { outcome: "mismatch", confidence: 0, reasons: ["Empty legal name"] };
  }
  const existing = input.existingNormalizedName?.trim().toLowerCase() ?? "";
  if (!existing) {
    return { outcome: "exact_match", confidence: 1, reasons: ["No existing record to compare"] };
  }
  if (normalized === existing) {
    reasons.push("Normalized legal name matches exactly");
    return { outcome: "exact_match", confidence: 1, reasons };
  }
  const docName = input.documentOwnerName ? normalizeLegalName(input.documentOwnerName) : "";
  if (docName && docName === existing) {
    reasons.push("Document owner name matches existing normalized name");
    return { outcome: "exact_match", confidence: 0.95, reasons };
  }
  const sim = similarity(normalized, existing);
  if (sim >= 0.95) {
    reasons.push(`High name similarity: ${(sim * 100).toFixed(0)}%`);
    return { outcome: "exact_match", confidence: sim, reasons };
  }
  if (sim >= 0.85) {
    reasons.push(`Good name similarity: ${(sim * 100).toFixed(0)}%`);
    return { outcome: "probable_match", confidence: sim, reasons };
  }
  if (sim >= 0.6) {
    reasons.push(`Moderate similarity: ${(sim * 100).toFixed(0)}% – recommend manual review`);
    return { outcome: "manual_review_required", confidence: sim, reasons };
  }
  reasons.push(`Low similarity: ${(sim * 100).toFixed(0)}%`);
  return { outcome: "mismatch", confidence: sim, reasons };
}

export interface BrokerResolutionInput {
  legalName: string;
  licenseNumber: string;
  brokerageName?: string | null;
  existingNormalizedName?: string | null;
  existingLicenseNumber?: string | null;
  existingBrokerageName?: string | null;
}

/**
 * Resolve broker identity: license number is strong signal; name and brokerage support.
 */
export function resolveBrokerIdentity(input: BrokerResolutionInput): {
  outcome: ResolutionOutcome;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  const licenseA = (input.licenseNumber ?? "").trim();
  const licenseB = (input.existingLicenseNumber ?? "").trim();
  if (licenseA && licenseB) {
    if (licenseA === licenseB) {
      reasons.push("License number matches exactly");
      const nameNorm = normalizeLegalName(input.legalName);
      const existingNorm = input.existingNormalizedName ?? "";
      const nameSim = existingNorm ? similarity(nameNorm, existingNorm) : 1;
      const confidence = 0.9 + 0.1 * nameSim;
      return { outcome: "exact_match", confidence, reasons };
    }
    reasons.push("License number differs");
    return { outcome: "mismatch", confidence: 0, reasons };
  }
  const nameNorm = normalizeLegalName(input.legalName);
  const existingNorm = (input.existingNormalizedName ?? "").trim().toLowerCase();
  if (!existingNorm) {
    return { outcome: "exact_match", confidence: 1, reasons: ["No existing broker to compare"] };
  }
  const nameSim = similarity(nameNorm, existingNorm);
  const brokerageNorm = normalizeLegalName(input.brokerageName);
  const existingBrokerage = (input.existingBrokerageName ?? "").trim().toLowerCase();
  const brokerageSim = brokerageNorm && existingBrokerage ? similarity(brokerageNorm, existingBrokerage) : 0;
  const combined = nameSim * 0.7 + (brokerageSim || 0) * 0.3;
  if (combined >= 0.95) {
    reasons.push("Name and brokerage match strongly");
    return { outcome: "exact_match", confidence: combined, reasons };
  }
  if (combined >= 0.85) {
    reasons.push("Name and brokerage probable match");
    return { outcome: "probable_match", confidence: combined, reasons };
  }
  if (combined >= 0.6) {
    reasons.push("Moderate match – manual review recommended");
    return { outcome: "manual_review_required", confidence: combined, reasons };
  }
  return { outcome: "mismatch", confidence: combined, reasons };
}

export interface OrganizationResolutionInput {
  legalName: string;
  existingNormalizedName?: string | null;
}

/**
 * Resolve organization identity by normalized legal name.
 */
export function resolveOrganizationIdentity(input: OrganizationResolutionInput): {
  outcome: ResolutionOutcome;
  confidence: number;
  reasons: string[];
} {
  const normalized = normalizeOrganizationName(input.legalName);
  const existing = (input.existingNormalizedName ?? "").trim().toLowerCase();
  const reasons: string[] = [];
  if (!normalized) {
    return { outcome: "mismatch", confidence: 0, reasons: ["Empty legal name"] };
  }
  if (!existing) {
    return { outcome: "exact_match", confidence: 1, reasons: ["No existing organization to compare"] };
  }
  if (normalized === existing) {
    reasons.push("Normalized legal name matches exactly");
    return { outcome: "exact_match", confidence: 1, reasons };
  }
  const sim = similarity(normalized, existing);
  if (sim >= 0.95) return { outcome: "exact_match", confidence: sim, reasons: ["High name similarity"] };
  if (sim >= 0.85) return { outcome: "probable_match", confidence: sim, reasons: ["Good name similarity"] };
  if (sim >= 0.6) return { outcome: "manual_review_required", confidence: sim, reasons: ["Moderate similarity"] };
  return { outcome: "mismatch", confidence: sim, reasons: ["Low similarity"] };
}
