/**
 * AI Contract Engine — specimen-oriented form metadata (structure / workflow assistance).
 * Does not replace mandatory OACIQ publisher forms or broker judgment.
 */

export type FormCategory =
  | "principal"
  | "annex"
  | "notice"
  | "disclosure"
  | "due_diligence"
  | "description_sheet"
  | "follow_up"
  | "brokerage_contract"
  | "identity"
  | "other";

export type MandatoryOrRecommended = "mandatory" | "recommended" | "conditional" | "ancillary";

export type FormFieldDef = {
  key: string;
  label: string;
  family:
    | "party"
    | "broker"
    | "property"
    | "price"
    | "deposit"
    | "financing"
    | "date"
    | "condition"
    | "annex"
    | "signature"
    | "other";
  required: boolean;
};

export type SectionDef = {
  sectionKey: string;
  title: string;
  fieldKeys: string[];
};

export type FormDefinition = {
  formKey: string;
  formCode: string;
  title: string;
  formCategory: FormCategory;
  mandatoryOrRecommended: MandatoryOrRecommended;
  jurisdiction: string;
  transactionDomain: "residential_sale" | "residential_purchase" | "coownership" | "lease" | "amendment" | "multi";
  mainUseCase: string;
  sourceDocument: string;
  versionLabel?: string;
  sectionDefinitions: SectionDef[];
  fieldDefinitions: FormFieldDef[];
  dependencyRules: string[];
  reviewWarnings: string[];
  scenarioTags: string[];
};

export const DRAFT_ASSISTANCE_NOTICE = "Draft assistance — broker review required." as const;
