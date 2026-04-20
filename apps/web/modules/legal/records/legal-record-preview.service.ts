/**
 * Preview / explainability bridge — summaries only (no raw document payloads).
 */

import { prisma } from "@/lib/db";
import { legalHubFlags } from "@/config/feature-flags";
import type { LegalRecordValidationBundleV1 } from "./legal-record.types";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export type LegalPreviewOverlay = {
  readinessLines: string[];
  ruleImpacts: string[];
};

export async function buildLegalPreviewOverlayForListing(listingId: string): Promise<LegalPreviewOverlay> {
  const empty: LegalPreviewOverlay = { readinessLines: [], ruleImpacts: [] };
  if (!legalHubFlags.legalAiLogicV1 || !legalHubFlags.legalHubV1 || !legalHubFlags.legalRecordImportV1) return empty;
  try {
    const rows = await prisma.legalRecord.findMany({
      where: { entityType: "fsbo_listing", entityId: listingId },
      select: { recordType: true, validation: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    const readinessLines: string[] = [];
    const ruleImpacts: string[] = [];
    for (const r of rows) {
      const raw = r.validation;
      if (!raw || typeof raw !== "object") continue;
      const bundle = raw as LegalRecordValidationBundleV1;
      if (bundle.version !== 1 || !bundle.validation) continue;
      if (bundle.validation.missingFields.length > 0) {
        readinessLines.push(`Missing required declaration fields (${r.recordType}: ${bundle.validation.missingFields.slice(0, 4).join(", ")})`);
      }
      if (bundle.validation.inconsistentFields.length > 0) {
        readinessLines.push(`Inconsistent ownership or legal data (${r.recordType}: ${bundle.validation.inconsistentFields.join(", ")})`);
      }
      for (const rule of bundle.rules ?? []) {
        if (rule.impact === "blocks_listing" || rule.impact === "requires_review") {
          ruleImpacts.push(`[${rule.ruleId}] ${rule.message}`);
        }
      }
    }
    return {
      readinessLines: readinessLines.slice(0, 14),
      ruleImpacts: ruleImpacts.slice(0, 14),
    };
  } catch {
    return empty;
  }
}

/** 0 = best alignment, 1 = worst — for bounded trust adjustments. */
export function computeLegalRecordComplianceGap01(params: {
  missingTotal: number;
  inconsistentTotal: number;
  criticalRulesTotal: number;
  recordCount: number;
}): number {
  try {
    const n = Math.max(0, params.recordCount);
    if (n === 0) return 0;
    const weight =
      params.missingTotal + params.inconsistentTotal * 2 + params.criticalRulesTotal * 3;
    const denom = n * 6;
    return clamp01(weight / denom);
  } catch {
    return 0;
  }
}
