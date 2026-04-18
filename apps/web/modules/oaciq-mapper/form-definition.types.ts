/**
 * Specimen-oriented OACIQ form metadata — structure for mapping and preview.
 * Not an operative legal instrument; official publisher / broker-authorized forms apply at execution.
 */

export type PrincipalOrRelated = "principal" | "related" | "annex" | "notice";

export type MandatoryOrRecommended = "mandatory" | "recommended" | "conditional";

export type FieldType =
  | "text"
  | "textarea"
  | "currency"
  | "date"
  /** ISO date-time string for preview; not an execution timestamp */
  | "datetime"
  | "boolean"
  | "select"
  | "number"
  | "identity_block"
  | "signature_placeholder";

export type FieldDefinition = {
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  sourcePaths: string[];
  displayGroup: string;
  repeatable?: boolean;
  validationRuleRefs: string[];
  executionPlaceholder?: string;
  notes?: string;
};

export type SectionDefinition = {
  sectionKey: string;
  sectionLabel: string;
  order: number;
  description?: string;
  fields: FieldDefinition[];
};

export type FormDependencyRef = {
  ruleId: string;
  description: string;
  dependsOnFormKeys?: string[];
};

export type FormDefinition = {
  formKey: string;
  officialCode: string;
  title: string;
  mandatoryOrRecommended: MandatoryOrRecommended;
  versionLabel: string;
  principalOrRelated: PrincipalOrRelated;
  baseWorkflow: string;
  sections: SectionDefinition[];
  dependencies: FormDependencyRef[];
  validationRules: { ruleId: string; description: string }[];
  previewOrder: string[];
};
