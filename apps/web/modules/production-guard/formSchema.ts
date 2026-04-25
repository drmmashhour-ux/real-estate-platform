import { TurboDraftSection } from "../turbo-form-drafting/types";

export interface StrictFormSchema {
  formKey: string;
  version: string;
  requiredSections: string[];
  orderEnforced: boolean;
}

export const FORM_SCHEMAS: Record<string, StrictFormSchema> = {
  PROMISE_TO_PURCHASE: {
    formKey: "PROMISE_TO_PURCHASE",
    version: "1.0.0",
    requiredSections: ["PARTIES", "PROPERTY", "PRICE", "FINANCING", "INSPECTION", "WARRANTY", "INCLUSIONS", "EXPIRY", "SIGNATURE"],
    orderEnforced: true,
  },
  BROKERAGE_CONTRACT: {
    formKey: "BROKERAGE_CONTRACT",
    version: "1.0.0",
    requiredSections: ["PARTIES", "PROPERTY", "PRICE", "COMMISSION", "EXPIRY", "SIGNATURE"],
    orderEnforced: true,
  },
  SELLER_DISCLOSURE: {
    formKey: "SELLER_DISCLOSURE",
    version: "1.0.0",
    requiredSections: ["PARTIES", "PROPERTY", "DECLARATIONS", "SIGNATURE"],
    orderEnforced: true,
  },
  ADDENDUM_INCLUSION: {
    formKey: "ADDENDUM_INCLUSION",
    version: "1.0.0",
    requiredSections: ["PARTIES", "PROPERTY", "ADDENDUM_CONTENT", "SIGNATURE"],
    orderEnforced: true,
  },
};

export function validateFormSchema(formKey: string, sections: TurboDraftSection[]): { valid: boolean; errors: string[] } {
  const schema = FORM_SCHEMAS[formKey];
  if (!schema) return { valid: false, errors: [`Schema not found for ${formKey}`] };

  const errors: string[] = [];
  const sectionIds = sections.map(s => s.id);

  // Check required sections
  for (const req of schema.requiredSections) {
    if (!sectionIds.includes(req)) {
      errors.push(`Missing mandatory section: ${req}`);
    }
  }

  // Check order
  if (schema.orderEnforced) {
    const activeRequired = schema.requiredSections.filter(id => sectionIds.includes(id));
    const currentOrder = sections.filter(s => activeRequired.includes(s.id)).map(s => s.id);
    
    for (let i = 0; i < currentOrder.length; i++) {
      if (currentOrder[i] !== activeRequired[i]) {
        errors.push(`Invalid section order at position ${i + 1}. Expected ${activeRequired[i]}, found ${currentOrder[i]}.`);
        break; 
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
