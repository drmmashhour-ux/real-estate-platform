import { esc } from "@/modules/contracts/services/html-escape";

export type RentalOfferVars = {
  ref: string;
  tenantName: string;
  tenantEmail: string;
  propertyAddress: string;
  listingTitle: string;
  monthlyRentCents: number;
  leaseStart: string;
  leaseEnd: string;
  depositCents: number;
  conditions: string;
  generatedAt: string;
};

function money(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function buildRentalOfferHtml(v: RentalOfferVars): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Rental offer — ${esc(v.ref)}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111">
<header style="border-bottom:2px solid #D4AF37;padding-bottom:12px"><h1 style="margin:0">Rental offer (draft)</h1><p>Ref: ${esc(v.ref)} · ${esc(v.generatedAt)}</p></header>
<section><p><strong>Tenant:</strong> ${esc(v.tenantName)} (${esc(v.tenantEmail)})</p>
<p><strong>Premises:</strong> ${esc(v.listingTitle)} — ${esc(v.propertyAddress)}</p></section>
<section><h2 style="color:#B8860B">Terms</h2>
<p><strong>Monthly rent:</strong> ${esc(money(v.monthlyRentCents))}</p>
<p><strong>Term:</strong> ${esc(v.leaseStart)} to ${esc(v.leaseEnd)}</p>
<p><strong>Deposit:</strong> ${esc(money(v.depositCents))}</p></section>
<section><h2 style="color:#B8860B">Conditions</h2><p>${esc(v.conditions)}</p></section>
<section><p><em>Template only — not legal advice.</em></p></section>
<section><p>Tenant: ______________________ &nbsp; Landlord: ______________________</p></section>
</body></html>`;
}
