import { TurboFormTemplate } from "./types";

export const FORM_TEMPLATES: Record<string, TurboFormTemplate> = {
  PROMISE_TO_PURCHASE: {
    formKey: "PROMISE_TO_PURCHASE",
    title: "Promise to Purchase",
    jurisdiction: "QC",
    transactionType: "SALE",
    fields: [
      { key: "purchasePrice", label: "Purchase Price", type: "money", required: true },
      { key: "depositAmount", label: "Deposit Amount", type: "money", required: false },
      { key: "financingRequired", label: "Financing Required", type: "boolean", required: true },
      { key: "financingDelay", label: "Delay to obtain financing (days)", type: "text", required: false },
      { key: "inspectionRequired", label: "Inspection Required", type: "boolean", required: true },
      { key: "inspectionDelay", label: "Delay for inspection (days)", type: "text", required: false },
      { key: "withoutWarranty", label: "Sold without legal warranty", type: "boolean", required: true },
      { key: "rightOfWithdrawalAck", label: "I acknowledge the 3-day right of withdrawal", type: "boolean", required: true },
      { key: "privacyConsent", label: "Privacy Consent (Law 25)", type: "boolean", required: true },
      { key: "equitableTreatmentAck", label: "I acknowledge the fair treatment notice (unrepresented buyer)", type: "boolean", required: false },
      { key: "oaciqGuideAck", label: "I have received or accessed the OACIQ guide", type: "boolean", required: false },
      { key: "inclusions", label: "Inclusions", type: "textarea", required: false },
      { key: "exclusions", label: "Exclusions", type: "textarea", required: false },
      { key: "acceptanceExpiry", label: "Offer expiry date/time", type: "date", required: true },
    ],
    steps: [
      { id: "price", title: "Price & Deposit", fieldKeys: ["purchasePrice", "depositAmount"] },
      { id: "financing", title: "Financing & Inspection", fieldKeys: ["financingRequired", "financingDelay", "inspectionRequired", "inspectionDelay"] },
      { id: "legal", title: "Legal & Privacy", fieldKeys: ["withoutWarranty", "rightOfWithdrawalAck", "privacyConsent", "equitableTreatmentAck", "oaciqGuideAck"] },
      { id: "details", title: "Inclusions & Exclusions", fieldKeys: ["inclusions", "exclusions"] },
      { id: "expiry", title: "Final Details & Expiry", fieldKeys: ["acceptanceExpiry"] },
    ],
    requiredNotices: ["PRIVACY", "RISK"],
    outputSections: ["PARTIES", "PROPERTY", "PRICE", "FINANCING", "INSPECTION", "WARRANTY", "INCLUSIONS", "EXPIRY", "SIGNATURE"],
  },
  BROKERAGE_CONTRACT: {
    formKey: "BROKERAGE_CONTRACT",
    title: "Brokerage Contract - Seller",
    jurisdiction: "QC",
    transactionType: "SALE",
    fields: [
      { key: "listingPrice", label: "Listing Price", type: "money", required: true },
      { key: "commissionPercent", label: "Commission (%)", type: "text", required: true },
      { key: "contractExpiry", label: "Contract Expiry Date", type: "date", required: true },
      { key: "referralFees", label: "Referral compensation to other brokers", type: "money", required: false },
    ],
    steps: [
      { id: "pricing", title: "Listing Price", fieldKeys: ["listingPrice"] },
      { id: "commission", title: "Commission & Referrals", fieldKeys: ["commissionPercent", "referralFees"] },
      { id: "expiry", title: "Expiry", fieldKeys: ["contractExpiry"] },
    ],
    requiredNotices: ["REPRESENTATION", "PRIVACY"],
    outputSections: ["PARTIES", "PROPERTY", "PRICE", "COMMISSION", "EXPIRY", "SIGNATURE"],
  },
  SELLER_DISCLOSURE: {
    formKey: "SELLER_DISCLOSURE",
    title: "Declarations by the Seller of the Immovable",
    jurisdiction: "QC",
    transactionType: "SALE",
    fields: [
      { key: "yearBuilt", label: "Year of construction", type: "text", required: true },
      { key: "waterInfiltration", label: "Any history of water infiltration?", type: "boolean", required: true },
      { key: "foundationCracks", label: "Any visible foundation cracks?", type: "boolean", required: true },
      { key: "renovations", label: "List major renovations done", type: "textarea", required: false },
    ],
    steps: [
      { id: "history", title: "Property History", fieldKeys: ["yearBuilt", "renovations"] },
      { id: "defects", title: "Condition & Defects", fieldKeys: ["waterInfiltration", "foundationCracks"] },
    ],
    requiredNotices: ["TRANSPARENCY", "PRIVACY"],
    outputSections: ["PARTIES", "PROPERTY", "DECLARATIONS", "SIGNATURE"],
  },
  ADDENDUM_INCLUSION: {
    formKey: "ADDENDUM_INCLUSION",
    title: "Addendum - Inclusions and Exclusions",
    jurisdiction: "QC",
    transactionType: "SALE",
    fields: [
      { key: "addendumDate", label: "Date of Addendum", type: "date", required: true },
      { key: "detailedInclusions", label: "Detailed Inclusions", type: "textarea", required: true },
      { key: "detailedExclusions", label: "Detailed Exclusions", type: "textarea", required: true },
      { key: "evChargerAmbiguity", label: "Electric vehicle charger included?", type: "boolean", required: false },
    ],
    steps: [
      { id: "date", title: "Addendum Date", fieldKeys: ["addendumDate"] },
      { id: "content", title: "Items", fieldKeys: ["detailedInclusions", "detailedExclusions", "evChargerAmbiguity"] },
    ],
    requiredNotices: ["TRANSPARENCY"],
    outputSections: ["PARTIES", "PROPERTY", "ADDENDUM_CONTENT", "SIGNATURE"],
  },
};

export function getFormTemplate(formKey: string): TurboFormTemplate | undefined {
  return FORM_TEMPLATES[formKey];
}
