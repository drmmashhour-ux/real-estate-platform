/**
 * Email notifications for leads and reservations.
 * Uses Resend when configured; otherwise logs and does not throw.
 * Professional templates; reply-to set so inbox reply goes to the right party.
 */

import { sendEmail, getNotificationEmail, getReplyToEmail } from "./resend";

/** Public BNHub listing URL for emails (uses app base URL + slug). */
export function bnhubListingPublicUrl(listingCodeOrId: string | null | undefined): string | undefined {
  const slug = listingCodeOrId?.trim();
  if (!slug) return undefined;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (!base) return undefined;
  return `${base}/bnhub/${encodeURIComponent(slug)}`;
}
import {
  leadNotificationEmail,
  reservationNotificationEmail,
  clientConfirmationEmail,
  immoContactAckEmail,
  formSubmissionNotificationEmail,
  formStatusUpdateEmail,
} from "./templates";
import { getBrokerPhoneDisplay, getContactEmail, getSupportPhoneDisplay } from "@/lib/config/contact";

const LEGAL_EMAIL_FOOTER_COMPANY = "LECIPM";

/** Legal footer for all outgoing emails: company, contact, and links to Terms & Privacy. */
export function getLegalEmailFooter(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mashhourinvestments.com";
  const termsUrl = `${baseUrl.replace(/\/$/, "")}/legal/terms`;
  const privacyUrl = `${baseUrl.replace(/\/$/, "")}/legal/privacy`;
  const footerEmail = getContactEmail();
  const supportPhone = getSupportPhoneDisplay();
  const brokerPhone = getBrokerPhoneDisplay();
  return `
<div style="margin-top:2em;padding-top:1em;border-top:1px solid #eee;font-size:12px;color:#666;">
  <p style="margin:0 0 0.35em 0;font-weight:600;color:#444;">${LEGAL_EMAIL_FOOTER_COMPANY}</p>
  <p style="margin:0 0 0.25em 0;">Support: ${supportPhone}</p>
  <p style="margin:0 0 0.35em 0;">Broker: ${brokerPhone}</p>
  <p style="margin:0 0 0.5em 0;">✉️ <a href="mailto:${footerEmail}" style="color:#666;">${footerEmail}</a></p>
  <p style="margin:0;font-size:11px;">
    <a href="${termsUrl}" style="color:#666;">Terms</a> &middot; <a href="${privacyUrl}" style="color:#666;">Privacy Policy</a>
  </p>
</div>`;
}

/** Footer for all outgoing emails (company, email, phone from env) plus legal links. */
function getEmailFooter(): string {
  const company = process.env.COMPANY_NAME?.trim() || LEGAL_EMAIL_FOOTER_COMPANY;
  const email = getContactEmail();
  const parts: string[] = [
    `<strong style="color:#444;">${company}</strong>`,
    `Support: ${getSupportPhoneDisplay()}`,
    `Broker: ${getBrokerPhoneDisplay()}`,
    `✉️ ${email && email.includes("@") ? `<a href="mailto:${email}" style="color:#666;">${email}</a>` : email}`,
  ];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mashhourinvestments.com";
  const termsUrl = `${baseUrl.replace(/\/$/, "")}/legal/terms`;
  const privacyUrl = `${baseUrl.replace(/\/$/, "")}/legal/privacy`;
  const links = `<a href="${termsUrl}" style="color:#666;">Terms</a> &middot; <a href="${privacyUrl}" style="color:#666;">Privacy Policy</a>`;
  return `<p style="margin-top:2em;padding-top:1em;border-top:1px solid #eee;font-size:12px;color:#666;line-height:1.6;">${parts.join("<br>")}<br>${links}</p>`;
}

/**
 * 1. Lead notification → team (BROKER_EMAIL / notification address).
 * Reply-To set to client email so "Reply" in inbox goes directly to client.
 */
export async function sendLeadNotificationToBroker(params: {
  name: string;
  email: string;
  phone: string;
  message: string;
  listingCode?: string | null;
  listingUrl?: string | null;
}): Promise<void> {
  const to = getNotificationEmail();
  if (!to || !to.includes("@")) {
    console.log("[Email] No notification address (BROKER_EMAIL). Would send lead notification:", params);
    return;
  }
  const listingUrl = params.listingUrl ?? bnhubListingPublicUrl(params.listingCode ?? null);
  const { subject, html } = leadNotificationEmail({
    ...params,
    listingUrl: listingUrl ?? null,
  });
  const sent = await sendEmail({
    to,
    subject,
    html: html + getEmailFooter(),
    replyTo: params.email,
  });
  if (!sent) {
    console.log("[Email] Resend not configured. Would send lead notification:", { to, subject, ...params });
  }
}

/**
 * 2. Reservation notification → team.
 * Reply-To set to client email for direct reply to client.
 */
export async function sendReservationNotificationToBroker(params: {
  projectName: string;
  unitType: string;
  name: string;
  email: string;
  phone: string;
}): Promise<void> {
  const to = getNotificationEmail();
  if (!to || !to.includes("@")) {
    console.log("[Email] No notification address. Would send reservation notification:", params);
    return;
  }
  const { subject, html } = reservationNotificationEmail({
    project: params.projectName,
    unit: params.unitType,
    name: params.name,
    email: params.email,
    phone: params.phone,
  });
  const sent = await sendEmail({
    to,
    subject,
    html: html + getEmailFooter(),
    replyTo: params.email,
  });
  if (!sent) {
    console.log("[Email] Resend not configured. Would send reservation notification:", { to, subject, ...params });
  }
}

/**
 * 3. Client confirmation → client.
 * Reply-To set to company inbox (EMAIL_REPLY_TO) so client reply goes to you.
 */
/** ImmoContact acknowledgement — short, broker-focused copy. */
export async function sendImmoContactAcknowledgement(
  clientEmail: string,
  clientName: string,
  listingTitle?: string | null
): Promise<void> {
  if (!clientEmail || !clientEmail.includes("@")) return;
  const replyTo = getReplyToEmail();
  const { subject, html } = immoContactAckEmail({ name: clientName, listingTitle });
  const sent = await sendEmail({
    to: clientEmail,
    subject,
    html: html + getEmailFooter(),
    ...(replyTo ? { replyTo } : {}),
  });
  if (!sent) {
    console.log("[Email] Resend not configured. Would send ImmoContact ack to:", clientEmail);
  }
}

export async function sendClientConfirmationEmail(
  clientEmail: string,
  clientName?: string
): Promise<void> {
  if (!clientEmail || !clientEmail.includes("@")) return;
  const replyTo = getReplyToEmail();
  const { subject, html } = clientConfirmationEmail({
    name: clientName || clientEmail.split("@")[0] || "Valued Client",
  });
  const sent = await sendEmail({
    to: clientEmail,
    subject,
    html: html + getEmailFooter(),
    ...(replyTo ? { replyTo } : {}),
  });
  if (!sent) {
    console.log("[Email] Resend not configured. Would send client confirmation to:", clientEmail);
  }
}

/**
 * Form submission notification → admin.
 * Sent when a client submits a form (e.g. Amendments).
 */
export async function sendFormSubmissionNotificationToAdmin(params: {
  formType: string;
  submissionId: string;
  clientName?: string | null;
  clientEmail?: string | null;
}): Promise<void> {
  const to = getNotificationEmail();
  if (!to || !to.includes("@")) {
    console.log("[Email] No notification address. Would send form submission notification:", params);
    return;
  }
  const { subject, html } = formSubmissionNotificationEmail(params);
  const sent = await sendEmail({
    to,
    subject,
    html: html + getEmailFooter(),
    ...(params.clientEmail ? { replyTo: params.clientEmail } : {}),
  });
  if (!sent) {
    console.log("[Email] Resend not configured. Would send form submission notification:", { to, ...params });
  }
}

/**
 * Form status update → client (optional).
 * Polite email when admin changes status (in-review, approved, rejected, etc.).
 */
export async function sendFormStatusUpdateToClient(params: {
  clientEmail: string;
  formType: string;
  submissionId: string;
  status: string;
  clientName?: string | null;
}): Promise<void> {
  if (!params.clientEmail || !params.clientEmail.includes("@")) return;
  const { subject, html } = formStatusUpdateEmail({
    formType: params.formType,
    submissionId: params.submissionId,
    status: params.status,
    clientName: params.clientName,
  });
  const replyTo = getReplyToEmail();
  const sent = await sendEmail({
    to: params.clientEmail,
    subject,
    html: html + getEmailFooter(),
    ...(replyTo ? { replyTo } : {}),
  });
  if (!sent) {
    console.log("[Email] Resend not configured. Would send form status update to:", params.clientEmail);
  }
}

/**
 * AI follow-up escalation — rich summary for broker / ops inbox.
 */
export async function sendFollowUpEscalationEmail(params: {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  listingId: string | null;
  listingCode: string | null;
  score: number;
  tier: string;
  reason: string;
  transcriptSummary: string;
  brokerEmail?: string;
}): Promise<void> {
  const to = getNotificationEmail();
  if (!to || !to.includes("@")) {
    console.log("[Email] Escalation (no notification address):", params.leadId, params.reason);
    return;
  }
  const listingSlug = params.listingCode ?? params.listingId ?? null;
  const listingPublicUrl = bnhubListingPublicUrl(listingSlug);
  const subject = `[Escalation] ${params.reason} — ${params.name} (score ${params.score})`;
  const html = `
    <h2>Lead escalation — AI follow-up</h2>
    <p><strong>Reason:</strong> ${escapeHtml(params.reason)}</p>
    <p><strong>Lead ID:</strong> ${escapeHtml(params.leadId)}</p>
    <p><strong>Tier / score:</strong> ${escapeHtml(params.tier)} / ${params.score}</p>
    <p><strong>Name:</strong> ${escapeHtml(params.name)}<br/>
    <strong>Email:</strong> <a href="mailto:${escapeHtml(params.email)}">${escapeHtml(params.email)}</a><br/>
    <strong>Phone:</strong> ${escapeHtml(params.phone)}</p>
    <p><strong>Listing:</strong> ${escapeHtml(params.listingCode ?? params.listingId ?? "—")}${
      listingPublicUrl
        ? ` — <a href="${escapeHtml(listingPublicUrl)}" style="color:#0f766e;">Open listing</a>`
        : ""
    }</p>
    <h3>Summary / transcript</h3>
    <pre style="white-space:pre-wrap;font-size:13px;background:#f5f5f5;padding:12px;border-radius:8px;">${escapeHtml(params.transcriptSummary.slice(0, 8000))}</pre>
    <p style="font-size:12px;color:#666;">AI assistant only — not licensed brokerage. Handle regulated questions directly.</p>
  `;
  const sent = await sendEmail({
    to: params.brokerEmail && params.brokerEmail.includes("@") ? params.brokerEmail : to,
    subject,
    html: html + getEmailFooter(),
    replyTo: params.email,
  });
  if (!sent) {
    console.log("[Email] Escalation not sent (Resend off):", subject);
  }
}

/**
 * Lead funnel — user receives estimate + consultation CTA after /evaluate submit.
 */
export async function sendPropertyEstimateEmailToUser(params: {
  clientEmail: string;
  clientName?: string;
  estimate: number;
  minValue: number;
  maxValue: number;
}): Promise<boolean> {
  if (!params.clientEmail || !params.clientEmail.includes("@")) return false;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://mashhourinvestments.com";
  const consultUrl = `${base}/sell#sell-consultation`;
  const name = params.clientName?.trim() || params.clientEmail.split("@")[0] || "there";
  const fmt = (n: number) =>
    n.toLocaleString("en-CA", { maximumFractionDigits: 0, minimumFractionDigits: 0 });

  const subject = "Your property estimate is ready";
  const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.55;color:#111;max-width:560px;">
  <p style="margin:0 0 1em 0;">Hi ${escapeHtml(name)},</p>
  <p style="margin:0 0 1em 0;">Your property estimate is ready — thank you for using LECIPM.</p>
  <p style="margin:0 0 0.35em 0;"><strong>Estimated property value:</strong> $${escapeHtml(fmt(params.estimate))}</p>
  <p style="margin:0 0 1.25em 0;"><strong>Range:</strong> $${escapeHtml(fmt(params.minValue))} – $${escapeHtml(fmt(params.maxValue))}</p>
  <p style="margin:0 0 1.25em 0;font-size:14px;color:#444;">This AI estimate is based on market averages and may vary.</p>
  <p style="margin:0 0 1.5em 0;">
    <a href="${escapeHtml(consultUrl)}" style="display:inline-block;background:#D4AF37;color:#0B0B0B;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;">Book your FREE consultation</a>
  </p>
  <div style="margin-top:2em;padding-top:1.25em;border-top:1px solid #e5e5e5;font-size:14px;color:#333;">
    <p style="margin:0 0 0.25em 0;font-weight:700;">LECIPM</p>
    <p style="margin:0 0 0.15em 0;">+1 844 441 5444</p>
    <p style="margin:0;">+1 514 462 4457</p>
  </div>
</div>`;

  const replyTo = getReplyToEmail();
  const sent = await sendEmail({
    to: params.clientEmail,
    subject,
    html: html + getEmailFooter(),
    ...(replyTo ? { replyTo } : {}),
  });
  if (!sent) {
    console.log("[Email] Resend not configured. Would send property estimate to:", params.clientEmail);
  }
  return !!sent;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Meeting booked — optional client email when Resend is configured. */
export async function sendLeadMeetingConfirmationToClient(params: {
  clientEmail: string;
  clientName: string;
  meetingAt: Date;
}): Promise<void> {
  if (!params.clientEmail || !params.clientEmail.includes("@")) return;
  const when = params.meetingAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const replyTo = getReplyToEmail();
  const subject = `Your consultation with LECIPM — ${when}`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;line-height:1.5;color:#111;">
  <p>Hi ${escapeHtml(params.clientName.split(/\s+/)[0] || "there")},</p>
  <p>This confirms your scheduled time with <strong>LECIPM</strong>: <strong>${escapeHtml(when)}</strong>.</p>
  <p>Mohamed will walk through your goals and next steps. If you need to reschedule, reply to this email.</p>
  <p>— LECIPM</p>
</div>`;
  const sent = await sendEmail({
    to: params.clientEmail,
    subject,
    html: html + getEmailFooter(),
    ...(replyTo ? { replyTo } : {}),
  });
  if (!sent) {
    console.log("[Email] Resend not configured. Would send meeting confirmation to:", params.clientEmail);
  }
}

/** Internal alert for closing automation (broker inbox). */
export async function sendBrokerClosingAutomationAlert(subject: string, htmlBody: string): Promise<void> {
  const to = getNotificationEmail();
  if (!to?.includes("@")) return;
  await sendEmail({ to, subject, html: htmlBody + getEmailFooter() }).catch(() => {});
}

/** Deal marked won — notify broker dashboard email if configured. */
export async function sendBrokerDealWonNotification(params: {
  leadName: string;
  finalSalePrice?: number | null;
  finalCommission?: number | null;
}): Promise<void> {
  const to = getNotificationEmail();
  if (!to?.includes("@")) return;
  const price =
    params.finalSalePrice != null && params.finalSalePrice > 0
      ? `$${params.finalSalePrice.toLocaleString()}`
      : "—";
  const comm =
    params.finalCommission != null && params.finalCommission > 0
      ? `$${params.finalCommission.toLocaleString()}`
      : "—";
  const subject = `[LECIPM] Deal won — ${params.leadName}`;
  const html = `<p><strong>Deal marked won</strong></p>
  <p>Lead: ${escapeHtml(params.leadName)}</p>
  <p>Final sale price: ${escapeHtml(price)}</p>
  <p>Commission: ${escapeHtml(comm)}</p>`;
  await sendEmail({ to, subject, html: html + getEmailFooter() }).catch(() => {});
}
