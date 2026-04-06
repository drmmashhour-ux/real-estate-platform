import type { InsuranceLeadType } from "@prisma/client";
import { sendTransactionalEmail } from "@/lib/email/provider";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendInsuranceLeadToPartner(opts: {
  to: string;
  leadId: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  leadType: InsuranceLeadType;
  listingId: string | null;
  bookingId: string | null;
  message: string | null;
  listingContext?: string | null;
}): Promise<boolean> {
  const ctx =
    opts.listingContext?.trim() ||
    (opts.listingId ? `Listing ID: ${opts.listingId}` : null) ||
    (opts.bookingId ? `Booking ID: ${opts.bookingId}` : null);

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p><strong>New insurance lead</strong> (platform handoff)</p>
<p><strong>Lead ID:</strong> ${escapeHtml(opts.leadId)}</p>
<p><strong>Type:</strong> ${escapeHtml(opts.leadType)}</p>
<p><strong>Name:</strong> ${escapeHtml(opts.fullName ?? "—")}</p>
<p><strong>Email:</strong> ${escapeHtml(opts.email)}</p>
<p><strong>Phone:</strong> ${escapeHtml(opts.phone ?? "—")}</p>
${ctx ? `<p><strong>Context:</strong><br/>${escapeHtml(ctx).replace(/\n/g, "<br/>")}</p>` : ""}
${opts.message ? `<p><strong>Message:</strong><br/>${escapeHtml(opts.message).replace(/\n/g, "<br/>")}</p>` : ""}
<p style="margin-top:1.5rem;font-size:12px;color:#555">Recipient agreed to be contacted by a licensed insurance broker; consent text is stored in the platform database for this lead.</p>
</body></html>`;

  return sendTransactionalEmail({
    to: opts.to,
    subject: `Insurance lead · ${opts.leadType} · ${opts.email}`,
    html,
    template: "insurance_lead_partner",
    replyTo: opts.email,
  });
}
