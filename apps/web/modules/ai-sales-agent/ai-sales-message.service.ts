import { getPublicAppUrl } from "@/lib/config/public-app-url";

import { recordAiSalesEvent } from "./ai-sales-log.service";
import type { AiSalesMode, AiSalesTrigger } from "./ai-sales.types";

export const LECIPM_ASSISTANT_DISCLOSURE =
  "I’m the LECIPM assistant (not a human broker). I help you with next steps; a licensed broker on the platform may take over for showings and offers.";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wrapAssistantEmailBlock(bodyHtml: string): string {
  return `<div style="border-left:3px solid #D4AF37;padding:10px 12px;margin:0 0 16px 0;background:#f8f7f3">
<p style="margin:0 0 8px 0;font-size:13px;color:#333"><strong>LECIPM assistant</strong> — ${escapeHtml(LECIPM_ASSISTANT_DISCLOSURE)}</p>
<div style="font-size:14px;color:#111">${bodyHtml}</div></div>`;
}

export type FirstResponseParams = {
  leadId: string;
  listingTitle?: string | null;
  trigger: AiSalesTrigger;
  mode: AiSalesMode;
};

/** Short, transactional-style intro suitable for immediate send after capture. */
export function buildAiSalesFirstResponsePlain(params: FirstResponseParams): { subject: string; text: string; html: string } {
  const title = params.listingTitle?.trim();
  const origin = getPublicAppUrl();
  const listingBit = title ? ` for ${title}` : "";
  const subject = title ? `Next steps${listingBit}` : "Your request on LECIPM";
  const text = [
    "Hi — I’m the LECIPM assistant.",
    "",
    `I can help you get details and coordinate a visit${listingBit}.`,
    "Would you like to schedule a viewing this week?",
    "",
    `Continue: ${origin}`,
    "",
    LECIPM_ASSISTANT_DISCLOSURE,
  ].join("\n");

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.45;color:#111">
${wrapAssistantEmailBlock(`<p>Hi — <strong>I’m the LECIPM assistant.</strong></p>
<p>I can help you get full details and schedule a visit${title ? ` for <strong>${escapeHtml(title)}</strong>` : ""}.</p>
<p><strong>Would you like to visit this week?</strong></p>
<p><a href="${escapeHtml(origin)}">Open LECIPM</a></p>`)}
<p style="font-size:12px;color:#555">Sent by the LECIPM assistant on behalf of the platform — brokers handle licensed advice and showings.</p>
</body></html>`;

  void recordAiSalesEvent(params.leadId, "AI_SALES_MESSAGE_PLANNED", {
    assistant: "lecipm",
    mode: params.mode,
    trigger: params.trigger,
    explain: "first_response_template",
    templateKey: "ai_sales_first_response",
    subject,
    bodyPreview: text.slice(0, 220),
  });

  return { subject, text, html };
}

export function buildAiSalesFollowUpValue(params: {
  leadId: string;
  listingTitle?: string | null;
  mode: AiSalesMode;
}): { subject: string; html: string } {
  const origin = getPublicAppUrl();
  const title = params.listingTitle?.trim();
  const subject = title ? `Quick follow-up — ${title}` : "Quick follow-up from LECIPM";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.45;color:#111">
${wrapAssistantEmailBlock(`<p>Following up — still interested${title ? ` in <strong>${escapeHtml(title)}</strong>` : ""}?</p>
<p>I can summarize comparable listings and help you pick a visit time that works.</p>
<p><a href="${escapeHtml(origin)}">Continue on LECIPM</a></p>`)}
<p style="font-size:12px;color:#555">LECIPM assistant · not a licensed broker.</p>
</body></html>`;

  void recordAiSalesEvent(params.leadId, "AI_SALES_MESSAGE_PLANNED", {
    assistant: "lecipm",
    mode: params.mode,
    explain: "follow_up_value",
    templateKey: "ai_sales_followup_d1",
    subject,
  });

  return { subject, html };
}

export function buildAiSalesBookingPrompt(params: {
  leadId: string;
  listingTitle?: string | null;
  slotsLabel: string;
  mode: AiSalesMode;
}): { subject: string; html: string } {
  const origin = getPublicAppUrl();
  const title = params.listingTitle?.trim();
  const subject = "Pick a visit time";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.45;color:#111">
${wrapAssistantEmailBlock(`<p>${title ? `For <strong>${escapeHtml(title)}</strong> — ` : ""}here are some times we can propose to the listing side:</p>
<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(params.slotsLabel)}</pre>
<p>Reply with the option that works best, or continue on-platform.</p>
<p><a href="${escapeHtml(origin)}">Open LECIPM</a></p>`)}
<p style="font-size:12px;color:#555">LECIPM assistant · visits are confirmed by the broker.</p>
</body></html>`;

  void recordAiSalesEvent(params.leadId, "AI_SALES_MESSAGE_PLANNED", {
    assistant: "lecipm",
    mode: params.mode,
    explain: "booking_prompt",
    templateKey: "ai_sales_booking_prompt",
    subject,
  });

  return { subject, html };
}

export function buildAiSalesReminder(params: {
  leadId: string;
  listingTitle?: string | null;
  mode: AiSalesMode;
}): { subject: string; html: string } {
  const origin = getPublicAppUrl();
  const title = params.listingTitle?.trim();
  const subject = title ? `Reminder — ${title}` : "Reminder from LECIPM";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.45;color:#111">
${wrapAssistantEmailBlock(`<p>Gentle reminder — want help finishing scheduling${title ? ` for <strong>${escapeHtml(title)}</strong>` : ""}?</p>
<p><a href="${escapeHtml(origin)}">Return to LECIPM</a></p>`)}
<p style="font-size:12px;color:#555">LECIPM assistant.</p>
</body></html>`;

  void recordAiSalesEvent(params.leadId, "AI_SALES_MESSAGE_PLANNED", {
    assistant: "lecipm",
    mode: params.mode,
    explain: "reminder",
    templateKey: "ai_sales_reminder",
    subject,
  });

  return { subject, html };
}
