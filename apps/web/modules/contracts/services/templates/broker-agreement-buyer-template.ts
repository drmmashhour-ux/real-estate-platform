import { esc } from "@/modules/contracts/services/html-escape";

export type BrokerAgreementBuyerVars = {
  ref: string;
  brokerName: string;
  brokerEmail: string;
  clientName: string;
  clientEmail: string;
  searchCriteria: string;
  brokerObligations: string;
  clientObligations: string;
  remuneration: string;
  generatedAt: string;
};

export function buildBrokerAgreementBuyerHtml(v: BrokerAgreementBuyerVars): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Buyer brokerage agreement — ${esc(v.ref)}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111;line-height:1.45">
<header style="border-bottom:2px solid #D4AF37;padding-bottom:12px"><p style="margin:0;font-size:11px;color:#666">LECIPM · Mashhour Investments</p>
<h1 style="margin:8px 0">Buyer representation / search mandate</h1><p style="font-size:13px">Reference: <strong>${esc(v.ref)}</strong> · ${esc(v.generatedAt)}</p></header>
<section><h2 style="color:#B8860B">1. Parties</h2><p><strong>Broker:</strong> ${esc(v.brokerName)} (${esc(v.brokerEmail)})</p><p><strong>Client (buyer):</strong> ${esc(v.clientName)} (${esc(v.clientEmail)})</p></section>
<section><h2 style="color:#B8860B">2. Search criteria</h2><p>${esc(v.searchCriteria)}</p></section>
<section><h2 style="color:#B8860B">3. Broker obligations</h2><p>${esc(v.brokerObligations)}</p></section>
<section><h2 style="color:#B8860B">4. Client obligations</h2><p>${esc(v.clientObligations)}</p></section>
<section><h2 style="color:#B8860B">5. Remuneration</h2><p>${esc(v.remuneration)}</p></section>
<section><h2 style="color:#B8860B">6. Law &amp; platform</h2><p>Québec law. LECIPM is not a party to this mandate unless agreed elsewhere.</p><p>Electronic signatures are binding subject to applicable law.</p></section>
<section><h2 style="color:#B8860B">7. Signatures</h2><p>Broker: ______________________ Date: ________</p><p>Client: ______________________ Date: ________</p></section>
<footer style="margin-top:24px;font-size:11px;color:#666">Internal document — not tax or legal advice.</footer></body></html>`;
}
