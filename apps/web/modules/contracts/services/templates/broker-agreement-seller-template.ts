import { esc } from "@/modules/contracts/services/html-escape";

export type BrokerAgreementSellerVars = {
  ref: string;
  brokerName: string;
  brokerEmail: string;
  brokerLicense?: string;
  clientName: string;
  clientEmail: string;
  propertyAddress: string;
  exclusivity: "exclusive" | "non_exclusive";
  commissionTerms: string;
  durationMonths: number;
  cancellationTerms: string;
  generatedAt: string;
};

export function buildBrokerAgreementSellerHtml(v: BrokerAgreementSellerVars): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Seller brokerage agreement — ${esc(v.ref)}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111;line-height:1.45">
<header style="border-bottom:2px solid #C9A646;padding-bottom:12px"><p style="margin:0;font-size:11px;color:#666">LECIPM · Mashhour Investments</p>
<h1 style="margin:8px 0">Brokerage agreement (seller / listing)</h1><p style="font-size:13px">Reference: <strong>${esc(v.ref)}</strong> · ${esc(v.generatedAt)}</p></header>
<section><h2 style="color:#B8860B;font-size:1.05rem">1. Parties</h2>
<p><strong>Broker:</strong> ${esc(v.brokerName)} (${esc(v.brokerEmail)})${v.brokerLicense ? ` · OACIQ / licence: ${esc(v.brokerLicense)}` : ""}</p>
<p><strong>Client (seller):</strong> ${esc(v.clientName)} (${esc(v.clientEmail)})</p></section>
<section><h2 style="color:#B8860B;font-size:1.05rem">2. Property</h2><p>${esc(v.propertyAddress)}</p></section>
<section><h2 style="color:#B8860B;font-size:1.05rem">3. Mandate</h2>
<p><strong>Exclusivity:</strong> ${v.exclusivity === "exclusive" ? "Exclusive" : "Non-exclusive"} listing mandate.</p>
<p><strong>Duration:</strong> ${v.durationMonths} month(s) unless terminated as below.</p></section>
<section><h2 style="color:#B8860B;font-size:1.05rem">4. Commission</h2><p>${esc(v.commissionTerms)}</p></section>
<section><h2 style="color:#B8860B;font-size:1.05rem">5. Cancellation</h2><p>${esc(v.cancellationTerms)}</p></section>
<section><h2 style="color:#B8860B;font-size:1.05rem">6. Law &amp; platform</h2>
<p>Governed by the laws of the Province of Québec and Canada. LECIPM provides document tools only; the broker is responsible for regulatory compliance (including OACIQ where applicable).</p>
<p><strong>Electronic signature</strong> is intended to be binding under applicable law.</p></section>
<section><h2 style="color:#B8860B;font-size:1.05rem">7. Signatures</h2><p>Broker: ______________________ Date: ________</p><p>Client: ______________________ Date: ________</p></section>
<footer style="margin-top:32px;font-size:11px;color:#666;border-top:1px solid #ddd;padding-top:8px">Internal document — verify with counsel.</footer></body></html>`;
}
