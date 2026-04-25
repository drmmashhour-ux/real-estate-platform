import { FORM_SCHEMAS } from "./formSchemaRegistry";

export interface SectionValidationResult {
  valid: boolean;
  missingSections: string[];
  invalidOrder: boolean;
  duplicates: string[];
}

export function validateSections(formKey: string, sectionIds: string[]): SectionValidationResult {
  const schema = FORM_SCHEMAS[formKey];
  if (!schema) {
    return { valid: true, missingSections: [], invalidOrder: false, duplicates: [] };
  }

  const missingSections = schema.requiredSections.filter(s => !sectionIds.includes(s));
  const duplicates = sectionIds.filter((item, index) => sectionIds.indexOf(item) !== index);
  
  let invalidOrder = false;
  if (schema.orderEnforced) {
    // Check if relative order matches schema for existing sections
    const existingSchemaSections = schema.requiredSections.filter(s => sectionIds.includes(s));
    const actualOrder = sectionIds.filter(s => schema.requiredSections.includes(s));
    
    for (let i = 0; i < actualOrder.length; i++) {
      if (actualOrder[i] !== existingSchemaSections[i]) {
        invalidOrder = true;
        break;
      }
    }
  }

  return {
    valid: missingSections.length === 0 && !invalidOrder && duplicates.length === 0,
    missingSections,
    invalidOrder,
    duplicates,
  };
}
