import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { sendEmail } from "@/lib/email/send";

export async function sendContractSignRequestEmail(params: {
  to: string[];
  signUrl: string;
  title: string;
  reference: string;
}): Promise<void> {
  const html = `
  <div style="font-family: system-ui, sans-serif; max-width: 560px;">
    <p style="color:#B8860B;font-weight:700;">LECIPM · Mashhour Investments</p>
    <h1 style="font-size:18px;">Please sign your lease</h1>
    <p>A residential lease agreement is ready for you: <strong>${escapeHtml(params.title)}</strong></p>
    <p>Reference: <code>${escapeHtml(params.reference)}</code></p>
    <p><a href="${escapeHtml(params.signUrl)}" style="display:inline-block;padding:12px 20px;background:#D4AF37;color:#0B0B0B;font-weight:700;">Review &amp; sign</a></p>
    <p style="font-size:12px;color:#666;">This electronic signature is legally binding under applicable Québec laws.</p>
  </div>`;
  for (const to of params.to) {
    await sendEmail({
      to,
      subject: `Sign your lease — ${params.reference}`,
      html,
      type: "deal_update",
    });
  }
}

export async function sendContractCompletedEmail(params: {
  to: string[];
  contractId: string;
  title: string;
}): Promise<void> {
  const appUrl = getPublicAppUrl();
  const viewUrl = `${appUrl}/contracts/${params.contractId}`;
  const html = `
  <div style="font-family: system-ui, sans-serif; max-width: 560px;">
    <p style="color:#B8860B;font-weight:700;">LECIPM</p>
    <h1 style="font-size:18px;">Lease fully signed</h1>
    <p>All parties have signed: <strong>${escapeHtml(params.title)}</strong></p>
    <p><a href="${escapeHtml(viewUrl)}">View contract</a> · Download PDF from the contract page.</p>
  </div>`;
  for (const to of params.to) {
    await sendEmail({
      to,
      subject: `Lease signed — ${params.title.slice(0, 40)}`,
      html,
      type: "deal_update",
    });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}
