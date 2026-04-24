export interface ProductionFieldSchema {
  key: string;
  type: "text" | "textarea" | "money" | "date" | "boolean" | "select";
  required: boolean;
  version: string;
}

export interface ProductionFormSchema {
  formKey: string;
  version: string;
  requiredSections: string[];
  fields: ProductionFieldSchema[];
  strictMode: boolean;
}

export const PRODUCTION_FORM_SCHEMAS: Record<string, ProductionFormSchema> = {
  PROMISE_TO_PURCHASE: {
    formKey: "PROMISE_TO_PURCHASE",
    version: "1.0.0",
    requiredSections: [
      "PARTIES", "PROPERTY", "PRICE", "FINANCING", "INSPECTION", 
      "LEGAL_WARRANTY", "INCLUSIONS_EXCLUSIONS", "DECLARATIONS", "SIGNATURE"
    ],
    fields: [
      { key: "purchasePrice", type: "money", required: true, version: "1.0.0" },
      { key: "financingRequired", type: "boolean", required: true, version: "1.0.0" },
      { key: "inspectionRequired", type: "boolean", required: true, version: "1.0.0" },
      { key: "withoutWarranty", type: "boolean", required: true, version: "1.0.0" },
      { key: "rightOfWithdrawalAck", type: "boolean", required: true, version: "1.0.0" },
      { key: "privacyConsent", type: "boolean", required: true, version: "1.0.0" },
      { key: "acceptanceExpiry", type: "date", required: true, version: "1.0.0" },
    ],
    strictMode: true
  },
  BROKERAGE_CONTRACT: {
    formKey: "BROKERAGE_CONTRACT",
    version: "1.0.0",
    requiredSections: ["PARTIES", "PROPERTY", "PRICE", "COMMISSION", "EXPIRY", "SIGNATURE"],
    fields: [
      { key: "listingPrice", type: "money", required: true, version: "1.0.0" },
      { key: "commissionPercent", type: "text", required: true, version: "1.0.0" },
      { key: "contractExpiry", type: "date", required: true, version: "1.0.0" },
    ],
    strictMode: true
  }
};

export function validateFormSchema(formKey: string, data: any): { valid: boolean; errors: string[] } {
  const schema = PRODUCTION_FORM_SCHEMAS[formKey];
  if (!schema) return { valid: false, errors: [`Schema not found for ${formKey}`] };

  const errors: string[] = [];

  // 1. Check required fields
  schema.fields.forEach(field => {
    if (field.required && (data.answers?.[field.key] === undefined || data.answers?.[field.key] === null || data.answers?.[field.key] === "")) {
      errors.push(`Field ${field.key} is required`);
    }
  });

  // 2. Check structure (no foreign fields in strict mode)
  if (schema.strictMode && data.answers) {
    const fieldKeys = new Set(schema.fields.map(f => f.key));
    Object.keys(data.answers).forEach(key => {
      if (!fieldKeys.has(key)) {
        errors.push(`Unknown field ${key} provided in strict mode`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
