import type { FormDefinition } from "./form-definition.types";

export type MappedFieldEntry = {
  fieldKey: string;
  value: unknown;
  sourcePath: string;
  confidence: number;
  unmapped?: boolean;
};

export type MapFormResult = {
  formKey: string;
  officialCode: string;
  draftNotice: "Draft assistance — broker review required.";
  mappedFields: Record<string, unknown>;
  fieldTrace: MappedFieldEntry[];
  missingRequiredKeys: string[];
  warnings: string[];
};

export type ExactValidationIssue = {
  severity: "info" | "warning" | "critical";
  code: string;
  fieldKey?: string;
  sectionKey?: string;
  formKey?: string;
  message: string;
  brokerReviewRequired: true;
};

export type PreviewBlock = {
  kind: "section" | "field" | "divider";
  sectionKey?: string;
  fieldKey?: string;
  label: string;
  valueDisplay: string;
  order: number;
  validationRefs?: string[];
};

export type PreviewBundle = {
  formKey: string;
  blocks: PreviewBlock[];
  draftNotice: "Draft assistance — broker review required.";
};

export type FormDefinitionExport = FormDefinition;
