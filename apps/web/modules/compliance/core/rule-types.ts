/**
 * LECIPM unified OACIQ / financial / records compliance — normalized case context + rule contract.
 * Final decisions remain with the licensed broker or authorized compliance person.
 */

export type ComplianceSeverity = "low" | "medium" | "high" | "critical";

export type ComplianceRuleCategory =
  | "selection"
  | "representation"
  | "advertising"
  | "verification"
  | "aml"
  | "records"
  | "trust"
  | "tax"
  | "supervision"
  /** OACIQ licence issue & maintenance — valid active residential scope only */
  | "licence";

export type ComplianceCaseContext = {
  caseId: string;
  dealId?: string;
  listingId?: string;
  propertyId?: string;
  brokerId?: string;
  clientId?: string;

  transactionType?:
    | "listing"
    | "purchase"
    | "lease"
    | "deposit"
    | "commission"
    | "trust_fund"
    | "cash_receipt"
    | "refund"
    | "advertising"
    | "client_solicitation";

  representationRole?:
    | "seller_broker"
    | "buyer_broker"
    | "dual"
    | "unrepresented_party"
    | "agency_admin";

  paymentMethod?: "cash" | "wire" | "cheque" | "card" | "other";
  amount?: number;
  currency?: "CAD" | "USD" | "OTHER";

  contractId?: string | null;
  trustAccountId?: string | null;

  payer?: {
    fullName?: string;
    address?: string;
    dateOfBirth?: string;
    occupation?: string;
    identityVerified?: boolean;
  };

  beneficiary?: {
    fullName?: string;
  };

  identityVerification?: {
    required: boolean;
    completed: boolean;
    mode?: "in_person" | "remote" | "dual_process" | "entity_documentation";
    documentRef?: string | null;
  };

  financialRecord?: {
    created: boolean;
    ledgerEntryId?: string | null;
    receiptGenerated?: boolean;
    invoiceGenerated?: boolean;
    gstAmount?: number;
    qstAmount?: number;
    /** Pre-tax + GST + QST where applicable */
    total?: number;
  };

  advertising?: {
    active: boolean;
    signedBrokerageContractPresent: boolean;
    containsRequiredStatements: boolean;
    containsMisleadingClaims: boolean;
    mentionsSoldPrice: boolean;
    mentionsGuarantee: boolean;
    isComingSoonOrPreMarket?: boolean;
    comingSoonAllowed?: boolean;
    holdsValidLicense?: boolean;
    solicitationConflictsWithExclusive?: boolean;
    referralBenefitPresent?: boolean;
  };

  aml?: {
    suspiciousIndicators: string[];
    highRisk: boolean;
    largeCashTransaction: boolean;
    reportingRequired: boolean;
    recordKeepingComplete: boolean;
    indicatorScore?: number;
  };

  documents?: {
    cashReceiptFormId?: string | null;
    trustNoticeFormId?: string | null;
    invoiceId?: string | null;
    auditPackId?: string | null;
  };

  /**
   * Populated for brokerage gates (listing, deal, offer). When set, licence rules evaluate.
   * Omit on unrelated compliance cases so licence pack stays inert.
   */
  brokerageLicence?: {
    brokerIdentityVerified: boolean;
    oaciqLicenceRecordVerified: boolean;
    licenceCategoryResidential: boolean;
    licenceStatusActive: boolean;
    brokerAttachedToTransaction: boolean;
    /** AI / automation must not execute legally binding brokerage acts */
    platformAcknowledgesAiAssistOnly: boolean;
    /** Heuristic: commercial keywords or five-plus dwellings — out of residential scope */
    transactionWithinResidentialScope: boolean;
    /** True when classification cannot be confirmed — risk only, not auto-block */
    propertyClassificationUnclear?: boolean;
  };

  /** Selection, records, supervision, tax registration, solo-broker flags, etc. */
  metadata?: Record<string, unknown>;
};

export type ComplianceRuleResult = {
  ruleId: string;
  passed: boolean;
  severity: ComplianceSeverity;
  code: string;
  title: string;
  message: string;
  requiredActions?: string[];
  /** When true and failed, engine marks run as blocked. */
  blocking?: boolean;
};

export type ComplianceRule = {
  id: string;
  category: ComplianceRuleCategory;
  evaluate: (ctx: ComplianceCaseContext) => ComplianceRuleResult | null;
};
