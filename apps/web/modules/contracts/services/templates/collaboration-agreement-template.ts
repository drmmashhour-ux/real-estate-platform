import { esc } from "@/modules/contracts/services/html-escape";

export type CollaborationAgreementVars = {
  ref: string;
  brokerAName: string;
  brokerAEmail: string;
  brokerBName: string;
  brokerBEmail: string;
  listingRef: string;
  roleA: string;
  roleB: string;
  splitTerms: string;
  generatedAt: string;
};

export function buildCollaborationAgreementHtml(v: CollaborationAgreementVars): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Broker collaboration — ${esc(v.ref)}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111">
<header style="border-bottom:2px solid #C9A646;padding-bottom:12px"><h1 style="margin:0">Cooperation agreement (broker–broker)</h1><p style="font-size:13px">Ref: ${esc(v.ref)} · ${esc(v.generatedAt)}</p></header>
<section><p><strong>Broker A:</strong> ${esc(v.brokerAName)} (${esc(v.brokerAEmail)}) — ${esc(v.roleA)}</p>
<p><strong>Broker B:</strong> ${esc(v.brokerBName)} (${esc(v.brokerBEmail)}) — ${esc(v.roleB)}</p>
<p><strong>Listing / transaction reference:</strong> ${esc(v.listingRef)}</p></section>
<section><h2 style="color:#B8860B">Commission split</h2><p>${esc(v.splitTerms)}</p></section>
<section><h2 style="color:#B8860B">Cooperation</h2><p>Parties agree to cooperate in good faith and comply with applicable brokerage rules.</p></section>
<section><h2 style="color:#B8860B">Disputes</h2><p>Negotiation first; then mediation or arbitration as agreed in writing or required by law.</p></section>
<section><p>Québec law. LECIPM provides document tools only.</p></section>
<section><p>Broker A: ______________________ &nbsp; Broker B: ______________________</p></section>
</body></html>`;
}
