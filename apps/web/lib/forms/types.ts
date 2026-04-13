/**
 * Structured form definitions for legal drafting (assistive AI + rule engine).
 * Schemas are stored as JSON on LegalFormTemplate.schemaJson.
 */

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "money_cents"
  | "date"
  | "boolean"
  | "select"
  | "custom_clause";

export type FormFieldSchema = {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  /** Dot-path keys in platform context JSON for deterministic prefill */
  sourceMappings?: string[];
  aiPrefillEligible?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  options?: { value: string; label: string }[];
};

export type FormSectionSchema = {
  id: string;
  title: string;
  fields: FormFieldSchema[];
};

export type LegalFormSchemaDocument = {
  version: string;
  transactionTypes?: string[];
  sections: FormSectionSchema[];
};

export type RuleEngineResult = {
  alerts: {
    severity: "info" | "warning" | "high" | "blocking";
    alertType: string;
    title: string;
    body: string;
    sourceType?: string;
    sourceRef?: string;
  }[];
  details: Record<string, unknown>;
};
