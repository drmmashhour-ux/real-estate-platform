/** Processing / rules semver for audit replay */
export const ESG_DOCUMENT_PROCESSING_VERSION = "v1.0.0";
export const ESG_EXTRACTION_RULES_VERSION = "v1.0.0";

export type EsgDocumentType =
  | "UTILITY_BILL"
  | "CERTIFICATION"
  | "ENERGY_AUDIT"
  | "RENOVATION_REPORT"
  | "CLIMATE_PLAN"
  | "DECARBONIZATION_PLAN"
  | "INSPECTION_REPORT"
  | "HVAC_REPORT"
  | "ESG_DISCLOSURE"
  | "BUILDING_PLAN"
  | "OTHER";

export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVIEW_REQUIRED";

export type ExtractedFieldRecord = {
  fieldName: string;
  fieldValueText: string;
  fieldValueNumber?: number | null;
  unit?: string | null;
  extractionMethod: "OCR" | "TEXT_PARSE" | "RULES" | "AI_ASSISTED";
  verification: "VERIFIED" | "UNCONFIRMED" | "ESTIMATED";
  confidence: number;
  sourcePage?: number | null;
  note?: string | null;
};

export type ClassificationResult = {
  documentType: EsgDocumentType;
  confidence: number;
  signals: string[];
};

export type ConflictReviewFlag = {
  severity: "HIGH" | "MEDIUM";
  fieldName: string;
  issue: string;
  oldValue?: string | null;
  newValue?: string | null;
  recommendedAction: string;
};

export type InvestorEvidenceSummary = {
  verifiedDocuments: number;
  utilityProofStatus: "VERIFIED" | "PARTIAL" | "NONE";
  certificationProofStatus: "VERIFIED" | "PARTIAL" | "NONE";
  climatePlanStatus: "VERIFIED" | "UPLOADED" | "NONE";
  lastEvidenceUpdate: string | null;
  verifiedVsEstimatedRatio: number | null;
  missingCriticalDocs: string[];
};
