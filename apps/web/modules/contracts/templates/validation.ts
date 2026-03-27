import type { ContractTemplateDefinition, ContractTemplateField } from "./types";

export type AnswersRecord = Record<string, string | number | boolean | null | undefined>;

export function validateRequiredFields(
  def: ContractTemplateDefinition,
  answers: AnswersRecord
): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  for (const f of def.fields) {
    if (!f.required) continue;
    const v = answers[f.key];
    if (v === undefined || v === null || v === "") {
      missing.push(f.key);
      continue;
    }
    if (typeof v === "boolean" && f.fieldType === "boolean" && v !== true) {
      missing.push(f.key);
    }
  }
  return missing.length ? { ok: false, missing } : { ok: true };
}

export function sortSections<T extends { sortOrder: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function fieldsForSection(
  def: ContractTemplateDefinition,
  sectionKey: string
): ContractTemplateField[] {
  return sortSections(def.fields.filter((f) => f.sectionKey === sectionKey));
}
