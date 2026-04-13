import type { LegalFormSchemaDocument } from "../types";

/** Sample structured schema — replace with real OACIQ mappings when licensed. */
export const OACIQ_PROMISE_SAMPLE_KEY = "oaciq_promise_to_purchase_v1";

export const oaciqPromiseSampleSchema: LegalFormSchemaDocument = {
  version: "1.0.0",
  transactionTypes: ["residential_purchase"],
  sections: [
    {
      id: "parties",
      title: "Parties",
      fields: [
        {
          id: "buyer_legal_name",
          label: "Buyer legal name",
          type: "text",
          required: true,
          sourceMappings: ["buyer.name"],
          aiPrefillEligible: true,
        },
        {
          id: "seller_legal_name",
          label: "Seller legal name",
          type: "text",
          required: true,
          sourceMappings: ["seller.name"],
          aiPrefillEligible: true,
        },
      ],
    },
    {
      id: "property",
      title: "Property",
      fields: [
        {
          id: "property_address",
          label: "Property address",
          type: "textarea",
          required: true,
          sourceMappings: ["listing.address"],
          aiPrefillEligible: true,
        },
        {
          id: "municipality",
          label: "Municipality",
          type: "text",
          required: false,
          sourceMappings: ["listing.city"],
          aiPrefillEligible: true,
        },
      ],
    },
    {
      id: "price_and_deposit",
      title: "Price and deposit",
      fields: [
        {
          id: "purchase_price_cents",
          label: "Purchase price (CAD)",
          type: "money_cents",
          required: true,
          sourceMappings: ["listing.priceCents"],
          aiPrefillEligible: true,
        },
        {
          id: "deposit_cents",
          label: "Deposit (CAD)",
          type: "money_cents",
          required: false,
          aiPrefillEligible: true,
        },
      ],
    },
    {
      id: "conditions",
      title: "Conditions",
      fields: [
        {
          id: "financing_condition",
          label: "Financing condition",
          type: "boolean",
          required: false,
          aiPrefillEligible: true,
        },
        {
          id: "inspection_condition",
          label: "Inspection condition",
          type: "boolean",
          required: false,
          aiPrefillEligible: true,
        },
      ],
    },
    {
      id: "custom_clauses",
      title: "Custom clauses",
      fields: [
        {
          id: "custom_clause_notes",
          label: "Custom clause notes (broker-edited)",
          type: "custom_clause",
          required: false,
          aiPrefillEligible: false,
        },
      ],
    },
  ],
};
