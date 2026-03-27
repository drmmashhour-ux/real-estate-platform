import type { RequiredDocumentCategory } from "@prisma/client";

export type IntakeTemplateKey =
  | "individual_buyer_basic"
  | "investor_basic"
  | "self_employed_buyer"
  | "corporation_purchase_basic";

export type RequiredDocumentSeed = {
  title: string;
  description?: string;
  category: RequiredDocumentCategory;
  isMandatory: boolean;
  /** Suggested days from apply (optional metadata for brokers) */
  suggestedDueInDays?: number;
};

const GOV_ID: RequiredDocumentSeed = {
  title: "Government-issued photo ID",
  description: "Driver’s license, passport, or provincial ID.",
  category: "IDENTITY",
  isMandatory: true,
  suggestedDueInDays: 3,
};

const PROOF_ADDRESS: RequiredDocumentSeed = {
  title: "Proof of current address",
  description: "Utility bill or bank statement showing your address (recent).",
  category: "RESIDENCY",
  isMandatory: true,
  suggestedDueInDays: 7,
};

const PROOF_INCOME: RequiredDocumentSeed = {
  title: "Proof of income",
  description: "Recent pay stubs or equivalent.",
  category: "INCOME",
  isMandatory: true,
  suggestedDueInDays: 7,
};

const BANK_STMT: RequiredDocumentSeed = {
  title: "Bank statements",
  description: "Last 90 days for primary accounts.",
  category: "BANKING",
  isMandatory: true,
  suggestedDueInDays: 7,
};

const EMP_LETTER: RequiredDocumentSeed = {
  title: "Employment letter",
  description: "Letter from employer confirming role and income.",
  category: "EMPLOYMENT",
  isMandatory: true,
  suggestedDueInDays: 10,
};

const CREDIT_CONSENT: RequiredDocumentSeed = {
  title: "Credit consent / supporting authorization",
  description: "Signed consent for credit review where applicable.",
  category: "CREDIT",
  isMandatory: true,
  suggestedDueInDays: 5,
};

const TAX_NOTICES: RequiredDocumentSeed = {
  title: "Tax documents (T1 / notices of assessment)",
  description: "Recent tax filings or NOAs as requested.",
  category: "TAX",
  isMandatory: true,
  suggestedDueInDays: 14,
};

const SELF_EMP_DOCS: RequiredDocumentSeed = {
  title: "Self-employment documentation",
  description: "Business registration, financial statements, or accountant letter.",
  category: "INCOME",
  isMandatory: true,
  suggestedDueInDays: 14,
};

const ARTICLES: RequiredDocumentSeed = {
  title: "Articles of incorporation",
  description: "Current corporate registry extract or articles.",
  category: "CORPORATE",
  isMandatory: true,
  suggestedDueInDays: 10,
};

const CORP_RESOLUTION: RequiredDocumentSeed = {
  title: "Corporate resolution / signing authority",
  description: "Board resolution authorizing the purchase if applicable.",
  category: "CORPORATE",
  isMandatory: false,
  suggestedDueInDays: 14,
};

const INVESTOR_PORTFOLIO: RequiredDocumentSeed = {
  title: "Investment / portfolio summary",
  description: "Optional: statements supporting liquidity for the transaction.",
  category: "BANKING",
  isMandatory: false,
  suggestedDueInDays: 10,
};

export const INTAKE_TEMPLATE_KEYS: IntakeTemplateKey[] = [
  "individual_buyer_basic",
  "investor_basic",
  "self_employed_buyer",
  "corporation_purchase_basic",
];

export function getIntakeTemplateSeeds(templateKey: IntakeTemplateKey): RequiredDocumentSeed[] {
  switch (templateKey) {
    case "individual_buyer_basic":
      return [GOV_ID, PROOF_ADDRESS, PROOF_INCOME, BANK_STMT, EMP_LETTER, CREDIT_CONSENT];
    case "investor_basic":
      return [GOV_ID, PROOF_ADDRESS, BANK_STMT, INVESTOR_PORTFOLIO, CREDIT_CONSENT, TAX_NOTICES];
    case "self_employed_buyer":
      return [GOV_ID, PROOF_ADDRESS, SELF_EMP_DOCS, BANK_STMT, TAX_NOTICES, CREDIT_CONSENT];
    case "corporation_purchase_basic":
      return [ARTICLES, CORP_RESOLUTION, BANK_STMT, TAX_NOTICES, GOV_ID, PROOF_ADDRESS];
    default:
      return [];
  }
}

export function isValidIntakeTemplateKey(key: string): key is IntakeTemplateKey {
  return INTAKE_TEMPLATE_KEYS.includes(key as IntakeTemplateKey);
}
