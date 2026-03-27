import { sendTransactionalEmail } from "@/lib/email/provider";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendFsboLeadEmailToOwner(opts: {
  to: string;
  listingTitle: string;
  listingId: string;
  leadName: string;
  leadEmail: string;
  leadMessage: string | null;
  origin: string;
}): Promise<boolean> {
  const url = `${opts.origin.replace(/\/$/, "")}/dashboard/fsbo`;
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>You received a new inquiry on your FSBO listing <strong>${escapeHtml(opts.listingTitle)}</strong>.</p>
<p><strong>From:</strong> ${escapeHtml(opts.leadName)} &lt;${escapeHtml(opts.leadEmail)}&gt;</p>
${opts.leadMessage ? `<p><strong>Message:</strong><br/>${escapeHtml(opts.leadMessage).replace(/\n/g, "<br/>")}</p>` : ""}
<p><a href="${escapeHtml(url)}">View leads in your dashboard</a></p>
</body></html>`;

  return sendTransactionalEmail({
    to: opts.to,
    subject: `FSBO inquiry — ${opts.listingTitle.slice(0, 60)}`,
    html,
    template: "fsbo_lead_owner",
    replyTo: opts.leadEmail,
  });
}
