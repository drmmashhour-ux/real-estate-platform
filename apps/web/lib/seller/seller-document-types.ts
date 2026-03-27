import type { SellerSupportingDocumentCategory } from "@prisma/client";

export const SELLER_DOCUMENT_CATEGORY_LABELS: Record<SellerSupportingDocumentCategory, string> = {
  IDENTITY: "Identity document",
  INSPECTION_REPORT: "Inspection report",
  RENOVATION_INVOICES: "Renovation invoices",
  PERMITS_PLANS: "Permits / plans",
  CERTIFICATES_WARRANTIES: "Certificates / warranties",
  CONDO_DOCUMENTS: "Condo documents",
  OTHER: "Other",
};

export const SELLER_DOCUMENT_CATEGORIES: SellerSupportingDocumentCategory[] = [
  "IDENTITY",
  "INSPECTION_REPORT",
  "RENOVATION_INVOICES",
  "PERMITS_PLANS",
  "CERTIFICATES_WARRANTIES",
  "CONDO_DOCUMENTS",
  "OTHER",
];

/** Optional link to declaration checklist sections (see `DECLARATION_SECTION_IDS`). */
export const DECLARATION_SECTION_LINK_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— Not linked —" },
  { value: "identity", label: "1. Identity & authority" },
  { value: "conflict", label: "2. Conflict of interest" },
  { value: "description", label: "3. Property description" },
  { value: "inclusions", label: "4. Inclusions / exclusions" },
  { value: "condition", label: "5. Property condition" },
  { value: "renovations", label: "6. Renovations & invoices" },
  { value: "pool", label: "7. Swimming pool" },
  { value: "inspection", label: "8. Inspection" },
  { value: "condo", label: "9. Condo / syndicate" },
  { value: "newConstruction", label: "10. New construction / GCR" },
  { value: "taxes", label: "11. Taxes & costs" },
  { value: "additionalDeclarations", label: "12. Details & additional declarations" },
  { value: "final", label: "13. Final declaration" },
];
