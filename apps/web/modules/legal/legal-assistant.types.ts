import type { LegalTemplateId } from "./templates";

/** Single counterparty or signatory. */
export type LegalDocumentParty = {
  role: string;
  legalName: string;
  email?: string;
  address?: string;
};

export type LegalPropertyInfo = {
  address?: string;
  unit?: string;
  city?: string;
  region?: string;
  country?: string;
  description?: string;
  label?: string;
};

export type LegalDocumentDates = {
  effectiveDate?: string;
  checkIn?: string;
  checkOut?: string;
  leaseStart?: string;
  leaseEnd?: string;
  termEnd?: string;
  policyEffective?: string;
};

export type LegalDocumentTerms = {
  currency?: string;
  totalAmount?: string;
  depositAmount?: string;
  rentAmount?: string;
  securityDeposit?: string;
  paymentDueDay?: string;
  governingLawNote?: string;
  /** Broker / cooperation draft */
  brokerLicenseInfo?: string;
  platformEntityName?: string;
  scopeSummary?: string;
  compensationSummary?: string;
  refundRulesSummary?: string;
  forceMajeureNote?: string;
  cancellationStrictness?: "strict" | "moderate" | "flexible";
  liabilityIntentNote?: string;
};

export type LegalAssistantClauseOptions = {
  includeCancellation?: boolean;
  includePaymentTerms?: boolean;
  includeLiability?: boolean;
};

export type LegalDocumentContext = {
  documentType: LegalTemplateId;
  property?: LegalPropertyInfo;
  parties?: LegalDocumentParty[];
  dates?: LegalDocumentDates;
  terms?: LegalDocumentTerms;
  clauses?: LegalAssistantClauseOptions;
};

export type GeneratedLegalDocument = {
  documentType: LegalTemplateId;
  title: string;
  fullDocument: string;
  /** Output is Markdown so users can edit in any editor or export. */
  editableFormat: "markdown";
  disclaimer: string;
  /** True when the pipeline did not substitute every placeholder (user should fill manually). */
  hasUnresolvedPlaceholders: boolean;
  unresolvedPlaceholderKeys: string[];
  notLegalAdvice: true;
};
