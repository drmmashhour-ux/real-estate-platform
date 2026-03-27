/**
 * Form template registry – reusable architecture for all OACIQ-style forms.
 * Add new form types here with schema and labels.
 */

import {
  AMENDMENTS_FORM_TYPE,
  amendmentsDefaultPayload,
  type AmendmentsPayload,
} from "./templates/amendments";

export type FormType = typeof AMENDMENTS_FORM_TYPE | "promise-to-purchase";

export type FormTemplateMeta = {
  formType: string;
  label: string;
  description: string;
  defaultPayload: () => Record<string, unknown>;
};

const registry: FormTemplateMeta[] = [
  {
    formType: AMENDMENTS_FORM_TYPE,
    label: "Amendments",
    description: "Amendment to brokerage contract / extension of acceptance or time period",
    defaultPayload: amendmentsDefaultPayload as () => Record<string, unknown>,
  },
];

export function getFormTemplate(formType: string): FormTemplateMeta | null {
  return registry.find((t) => t.formType === formType) ?? null;
}

export function getAllFormTypes(): FormTemplateMeta[] {
  return registry;
}

export function getDefaultPayloadForFormType(formType: string): Record<string, unknown> {
  const t = getFormTemplate(formType);
  return t ? t.defaultPayload() : {};
}

export type AmendmentsPayloadExport = AmendmentsPayload;
