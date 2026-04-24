import { FORM_SCHEMAS } from "./formSchemaRegistry";

export interface SectionValidationResult {
  valid: boolean;
  missingSections: string[];
  invalidOrder: boolean;
  duplicateSections: string[];
}

export function validateSections(formKey: string, draftSections: { title: string }[]): SectionValidationResult {
  const schema = FORM_SCHEMAS[formKey];
  if (!schema) {
    return { valid: false, missingSections: ["SCHEMA_NOT_FOUND"], invalidOrder: false, duplicateSections: [] };
  }

  const sectionTitles = draftSections.map(s => s.title.toUpperCase());
  const missingSections = schema.requiredSections.filter(s => !sectionTitles.includes(s));
  const duplicateSections = sectionTitles.filter((item, index) => sectionTitles.indexOf(item) !== index);

  let invalidOrder = false;
  if (schema.orderEnforced) {
    const presentRequired = schema.requiredSections.filter(s => sectionTitles.includes(s));
    const actualOrder = sectionTitles.filter(s => schema.requiredSections.includes(s));
    
    for (let i = 0; i < presentRequired.length; i++) {
      if (presentRequired[i] !== actualOrder[i]) {
        invalidOrder = true;
        break;
      }
    }
  }

  return {
    valid: missingSections.length === 0 && !invalidOrder && duplicateSections.length === 0,
    missingSections,
    invalidOrder,
    duplicateSections
  };
}
