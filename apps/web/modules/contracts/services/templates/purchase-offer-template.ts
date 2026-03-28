import { esc } from "@/modules/contracts/services/html-escape";

export type PurchaseOfferVars = {
  ref: string;
  buyerName: string;
  buyerEmail: string;
  sellerName?: string;
  propertyAddress: string;
  listingTitle: string;
  offerPriceCents: number;
  depositCents: number;
  financingCondition: string;
  inspectionCondition: string;
  occupancyDate: string;
  irrevocableUntil: string;
  extraConditions: string;
  generatedAt: string;
};

function money(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function buildPurchaseOfferHtml(v: PurchaseOfferVars): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Purchase offer — ${esc(v.ref)}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111">
<header style="border-bottom:2px solid #D4AF37;padding-bottom:12px"><h1 style="margin:0">Promise to purchase (draft)</h1><p>Ref: ${esc(v.ref)} · ${esc(v.generatedAt)}</p></header>
<section><p><strong>Buyer:</strong> ${esc(v.buyerName)} (${esc(v.buyerEmail)})</p>
${v.sellerName ? `<p><strong>Seller (if known):</strong> ${esc(v.sellerName)}</p>` : ""}
<p><strong>Property:</strong> ${esc(v.listingTitle)} — ${esc(v.propertyAddress)}</p></section>
<section><h2 style="color:#B8860B">Offer</h2><p><strong>Price:</strong> ${esc(money(v.offerPriceCents))}</p><p><strong>Deposit:</strong> ${esc(money(v.depositCents))}</p></section>
<section><h2 style="color:#B8860B">Conditions</h2><p><strong>Financing:</strong> ${esc(v.financingCondition)}</p><p><strong>Inspection:</strong> ${esc(v.inspectionCondition)}</p></section>
<section><p><strong>Occupancy / possession:</strong> ${esc(v.occupancyDate)}</p><p><strong>Irrevocable until:</strong> ${esc(v.irrevocableUntil)}</p></section>
<section><h2 style="color:#B8860B">Additional</h2><p>${esc(v.extraConditions)}</p></section>
<section><p><em>This is a template for discussion. Not legal advice. Review with a notary or lawyer before binding acceptance.</em></p></section>
<section><p>Buyer: ______________________ &nbsp; Seller: ______________________</p></section>
</body></html>`;
}
