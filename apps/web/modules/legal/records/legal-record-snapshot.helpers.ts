/**
 * Helpers to derive intelligence snapshot rows from persisted `LegalRecord` rows — no raw files.
 */

import type { LegalImportedRecordRow } from "../legal-intelligence.types";
import type { LegalRecordValidationBundleV1 } from "./legal-record.types";

function parseBundle(raw: unknown): LegalRecordValidationBundleV1 | null {
  try {
    if (!raw || typeof raw !== "object") return null;
    const v = raw as LegalRecordValidationBundleV1;
    if (v.version !== 1 || !v.validation || !Array.isArray(v.rules)) return null;
    return v;
  } catch {
    return null;
  }
}

export type PrismaLegalRecordMini = {
  id: string;
  recordType: string;
  status: string;
  parsedData: unknown;
  validation: unknown;
};

export function legalRecordToImportedRow(row: PrismaLegalRecordMini): LegalImportedRecordRow {
  const bundle = parseBundle(row.validation);
  const mf = bundle?.validation.missingFields?.length ?? 0;
  const ic = bundle?.validation.inconsistentFields?.length ?? 0;
  const wc = bundle?.validation.warnings?.length ?? 0;
  let criticalRuleCount = 0;
  let requiresReviewRuleCount = 0;
  if (bundle?.rules?.length) {
    for (const r of bundle.rules) {
      if (r.severity === "critical") criticalRuleCount += 1;
      if (r.impact === "requires_review") requiresReviewRuleCount += 1;
    }
  }

  let parcelIdFingerprint: string | null = null;
  try {
    if (
      row.recordType === "proof_of_ownership" &&
      row.parsedData &&
      typeof row.parsedData === "object"
    ) {
      const pd = row.parsedData as Record<string, unknown>;
      const rawPid = pd.parcelId ?? pd.parcel_id;
      if (typeof rawPid === "string" && rawPid.trim()) parcelIdFingerprint = rawPid.trim().toLowerCase();
    }
  } catch {
    parcelIdFingerprint = null;
  }

  return {
    id: row.id,
    recordType: row.recordType,
    status: row.status,
    missingFieldCount: mf,
    inconsistentFieldCount: ic,
    warningCount: wc,
    criticalRuleCount,
    requiresReviewRuleCount,
    parcelIdFingerprint,
  };
}
