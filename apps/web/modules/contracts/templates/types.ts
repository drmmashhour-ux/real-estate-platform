/**
 * Structured contract drafting — real-estate style sections (admin builder + runtime validation).
 */

export const TEMPLATE_SECTION_KEYS = [
  "identification",
  "property",
  "price_conditions",
  "obligations",
  "declarations",
  "signatures",
] as const;

export type TemplateSectionKey = (typeof TEMPLATE_SECTION_KEYS)[number];

export type TemplateFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "boolean"
  | "select";

export type TemplateAttachmentType = "seller_declaration";

export type ContractTemplateSection = {
  id: string;
  key: TemplateSectionKey;
  title: string;
  sortOrder: number;
};

export type ContractTemplateField = {
  id: string;
  sectionKey: TemplateSectionKey;
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  sortOrder: number;
  options?: string[];
  placeholder?: string;
};

export type ContractTemplateAttachment = {
  type: TemplateAttachmentType;
  required: boolean;
};

/** Full template definition stored in DB `ContractDraftTemplate.definition` or defaults in code. */
export type ContractTemplateDefinition = {
  sections: ContractTemplateSection[];
  fields: ContractTemplateField[];
  attachments: ContractTemplateAttachment[];
};

export type ContractTemplateRecord = {
  contractType: string;
  name: string;
  definition: ContractTemplateDefinition;
};
