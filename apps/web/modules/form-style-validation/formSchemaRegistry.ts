export interface FormSchema {
  formKey: string;
  requiredSections: string[];
  orderEnforced: boolean;
}

export const FORM_SCHEMAS: Record<string, FormSchema> = {
  PROMISE_TO_PURCHASE: {
    formKey: "PROMISE_TO_PURCHASE",
    requiredSections: [
      "PARTIES",
      "PROPERTY",
      "PRICE",
      "FINANCING",
      "INSPECTION",
      "LEGAL_WARRANTY",
      "INCLUSIONS_EXCLUSIONS",
      "DECLARATIONS",
      "SIGNATURE"
    ],
    orderEnforced: true
  },
  BROKERAGE_CONTRACT: {
    formKey: "BROKERAGE_CONTRACT",
    requiredSections: [
      "PARTIES",
      "PROPERTY",
      "PRICE",
      "COMMISSION",
      "EXPIRY",
      "SIGNATURE"
    ],
    orderEnforced: true
  },
  SELLER_DISCLOSURE: {
    formKey: "SELLER_DISCLOSURE",
    requiredSections: [
      "PARTIES",
      "PROPERTY",
      "DECLARATIONS",
      "SIGNATURE"
    ],
    orderEnforced: true
  }
};
