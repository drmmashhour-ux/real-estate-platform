import type { FormDefinition } from "./form-definition.types";
import { cpDefinition } from "./forms/cp/cp.definition";
import { dsDefinition } from "./forms/ds/ds.definition";
import { ivDefinition } from "./forms/iv/iv.definition";
import { ppDefinition } from "./forms/pp/pp.definition";
import { rhDefinition } from "./forms/rh/rh.definition";
import { risDefinition } from "./forms/ris/ris.definition";

const FORM_DEFINITIONS: Record<string, FormDefinition> = {
  PP: ppDefinition,
  CP: cpDefinition,
  DS: dsDefinition,
  IV: ivDefinition,
  RIS: risDefinition,
  RH: rhDefinition,
};

export function getFormDefinition(formKey: string): FormDefinition | undefined {
  return FORM_DEFINITIONS[formKey.toUpperCase()];
}

export function listFormKeys(): string[] {
  return Object.keys(FORM_DEFINITIONS);
}

export function listFormDefinitions(): FormDefinition[] {
  return Object.values(FORM_DEFINITIONS);
}
