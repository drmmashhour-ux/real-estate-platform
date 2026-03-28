import { esc } from "@/modules/contracts/services/html-escape";

export type ReferralAgreementVars = {
  ref: string;
  partyAName: string;
  partyAEmail: string;
  partyBName: string;
  partyBEmail: string;
  serviceScope: string;
  referralSource: string;
  revenueShare: string;
  generatedAt: string;
};

export function buildReferralAgreementHtml(v: ReferralAgreementVars): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Referral agreement — ${esc(v.ref)}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;color:#111">
<header style="border-bottom:2px solid #D4AF37;padding-bottom:12px"><h1 style="margin:0">Referral agreement</h1><p>Ref: ${esc(v.ref)} · ${esc(v.generatedAt)}</p></header>
<section><p><strong>Party A:</strong> ${esc(v.partyAName)} (${esc(v.partyAEmail)})</p><p><strong>Party B:</strong> ${esc(v.partyBName)} (${esc(v.partyBEmail)})</p></section>
<section><h2 style="color:#B8860B">Service scope</h2><p>${esc(v.serviceScope)}</p></section>
<section><h2 style="color:#B8860B">Referral source</h2><p>${esc(v.referralSource)}</p></section>
<section><h2 style="color:#B8860B">Revenue / commission share</h2><p>${esc(v.revenueShare)}</p></section>
<section><h2 style="color:#B8860B">Confidentiality</h2><p>Parties keep confidential information shared in connection with this referral.</p></section>
<section><h2 style="color:#B8860B">Non-circumvention</h2><p>Parties agree not to circumvent the agreed referral structure to avoid applicable fees.</p></section>
<section><p>Québec law. Platform tools only — not tax advice.</p></section>
<section><p>Party A: ______________________ &nbsp; Party B: ______________________</p></section>
</body></html>`;
}
