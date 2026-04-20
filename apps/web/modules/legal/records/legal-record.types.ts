/**
 * Legal Hub — imported legal records (structured metadata only in APIs).
 */

export type LegalRecordType =
  | "seller_declaration"
  | "lease_agreement"
  | "offer_to_purchase"
  | "identity_document"
  | "proof_of_ownership"
  | "compliance_document";

export type LegalRecordStatus =
  | "uploaded"
  | "parsed"
  | "validated"
  | "rejected"
  | "needs_review";

/** Application-level shape — maps to Prisma `LegalRecord` plus JSON fields. */
export type LegalRecord = {
  id: string;
  entityType: string;
  entityId: string;
  recordType: LegalRecordType;
  fileId: string;
  parsedData?: Record<string, unknown>;
  validationSummary?: Record<string, unknown>;
  status: LegalRecordStatus;
  createdAt: Date;
};

export type LegalParsedField = {
  key: string;
  value: string | number | boolean | null;
  confidence: "high" | "medium" | "low";
};

export type LegalValidationResult = {
  isValid: boolean;
  missingFields: string[];
  inconsistentFields: string[];
  warnings: string[];
};

export type LegalRuleSeverity = "info" | "warning" | "critical";

export type LegalRuleImpact =
  | "blocks_listing"
  | "requires_review"
  | "advisory_only"
  | "readiness_degraded";

export type LegalRuleResult = {
  ruleId: string;
  severity: LegalRuleSeverity;
  message: string;
  impact: LegalRuleImpact;
};

/** Stored in Prisma `LegalRecord.validation` JSON column. */
export type LegalRecordValidationBundleV1 = {
  version: 1;
  validation: LegalValidationResult;
  rules: LegalRuleResult[];
};
