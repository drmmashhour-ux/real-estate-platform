/**
 * Maps party roles to DocuSign anchor strings embedded in PDFs during prep.
 * Anchors must appear in the PDF for tab placement (see docusign.real.adapter).
 */
export const SIGNATURE_ANCHORS = {
  buyer: "/sig_buyer/",
  seller: "/sig_seller/",
  broker: "/sig_broker/",
} as const;

export function anchorForRole(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("buyer")) return SIGNATURE_ANCHORS.buyer;
  if (r.includes("seller")) return SIGNATURE_ANCHORS.seller;
  if (r.includes("broker")) return SIGNATURE_ANCHORS.broker;
  return "/sig_party/";
}
