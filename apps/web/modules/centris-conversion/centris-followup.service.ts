import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { sendTransactionalEmail } from "@/lib/email/provider";

import { enrichCentrisLeadSnapshot } from "./centris-enrich.service";
import { logConversion } from "./centris-funnel.log";

/** Law 25: only call when lead capture recorded explicit marketing consent. */
export async function sendCentrisAnalysisFollowUpEmail(params: {
  toEmail: string;
  leadId: string;
  listingTitle?: string;
}): Promise<boolean> {
  try {
    const enrich = await enrichCentrisLeadSnapshot(params.leadId);
    const origin = getPublicAppUrl();
    const signupUrl = `${origin}/auth/signup?returnUrl=${encodeURIComponent("/dashboard/buyer")}`;

    const peerLinks = enrich.similarListingIds
      .slice(0, 5)
      .map((lid) => {
        const url = `${origin}/listings/${lid}`;
        return `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`;
      })
      .join("");

    const peersBlock =
      peerLinks.length > 0
        ? `<p><strong>Similar listings to explore</strong> (examples only):</p><ul>${peerLinks}</ul>`
        : "";

    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>Thanks for your interest${params.listingTitle ? ` in <strong>${escapeHtml(params.listingTitle)}</strong>` : ""}.</p>
<p><strong>Here is your initial property analysis snapshot</strong> (advisory only, not an appraisal):</p>
<ul>
<li>${escapeHtml(enrich.priceAnalysis)}</li>
<li>Deal signal: ${escapeHtml(enrich.dealRating)}</li>
</ul>
${peersBlock}
<p><a href="${escapeHtml(origin)}">Open your LECIPM workspace</a> — create an account to unlock saved searches, visits, and documents.</p>
<p><a href="${escapeHtml(signupUrl)}">Create your LECIPM account</a></p>
<p style="font-size:12px;color:#555">Sent because you opted in to analysis updates from Centris-attributed traffic.</p>
</body></html>`;

    await sendTransactionalEmail({
      to: params.toEmail,
      subject: "Your LECIPM property analysis",
      html,
      template: "centris_followup_analysis",
    });

    logConversion("followup_email_sent", { leadId: params.leadId });
    return true;
  } catch (e) {
    logConversion("followup_email_failed", {
      leadId: params.leadId,
      err: e instanceof Error ? e.message : "unknown",
    });
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
