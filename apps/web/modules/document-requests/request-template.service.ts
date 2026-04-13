import type { CoordinationTargetRole, DealRequestCategory } from "@prisma/client";

export type RequestTemplateItem = { itemKey: string; itemLabel: string; isRequired: boolean };

export type RequestTemplate = {
  requestType: string;
  title: string;
  summary: string;
  targetRole: CoordinationTargetRole;
  category: DealRequestCategory;
  items: RequestTemplateItem[];
};

/** Québec brokered residential — starter checklist items (broker edits before send). */
export const REQUEST_TEMPLATES: Partial<Record<DealRequestCategory, RequestTemplate>> = {
  SELLER_DOCUMENTS: {
    requestType: "seller_package_v1",
    title: "Seller declaration & supporting documents",
    summary: "Seller declaration, updates, and supporting property documents as required for your file.",
    targetRole: "SELLER",
    category: "SELLER_DOCUMENTS",
    items: [
      { itemKey: "seller_declaration", itemLabel: "Completed seller declaration (as applicable)", isRequired: true },
      { itemKey: "tax_bills", itemLabel: "Recent municipal / school tax statements", isRequired: false },
      { itemKey: "renovation_invoices", itemLabel: "Renovation permits / invoices (if represented)", isRequired: false },
    ],
  },
  LENDER_DOCUMENTS: {
    requestType: "lender_info_v1",
    title: "Lender / mortgage file update",
    summary: "Request status sheet items from the mortgage representative (external lender).",
    targetRole: "LENDER",
    category: "LENDER_DOCUMENTS",
    items: [
      { itemKey: "commitment_or_update", itemLabel: "Financing commitment / undertaking or written update", isRequired: true },
      { itemKey: "conditions_list", itemLabel: "Outstanding financing conditions with dates", isRequired: true },
    ],
  },
  SYNDICATE_DOCUMENTS: {
    requestType: "condo_syndicate_v1",
    title: "Co-ownership / syndicate documents",
    summary: "Minutes, contingency fund, insurance certificate — as needed for the co-ownership context.",
    targetRole: "SYNDICATE",
    category: "SYNDICATE_DOCUMENTS",
    items: [
      { itemKey: "minutes", itemLabel: "Recent syndicate minutes / status certificate path", isRequired: true },
      { itemKey: "insurance", itemLabel: "Building insurance certificate (if required)", isRequired: false },
    ],
  },
  NOTARY_PREPARATION: {
    requestType: "notary_prep_v1",
    title: "Notary file preparation",
    summary: "Items your notary expects before deed — broker coordinates; notary is external.",
    targetRole: "NOTARY",
    category: "NOTARY_PREPARATION",
    items: [
      { itemKey: "ids_parties", itemLabel: "Identity verification path for parties (per notary instructions)", isRequired: true },
      { itemKey: "lender_instructions", itemLabel: "Lender closing instructions / undertaking delivery path", isRequired: false },
    ],
  },
};

export function getTemplateForCategory(category: DealRequestCategory): RequestTemplate | null {
  return REQUEST_TEMPLATES[category] ?? null;
}
