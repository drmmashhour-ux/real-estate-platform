/**
 * Prepared copy for manual or future automated drip (do not auto-send all without ops review).
 */

export type FollowUpTemplateId = "evaluation_followup_2" | "evaluation_followup_3";

const BASE = {
  brand: "LECIPM",
  consultPath: "/sell#sell-consultation",
} as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getEvaluationFollowUpEmail(
  templateId: FollowUpTemplateId,
  params: { recipientName?: string; baseUrl: string }
): { subject: string; html: string } {
  const name = params.recipientName?.trim() || "there";
  const consultUrl = `${params.baseUrl.replace(/\/$/, "")}${BASE.consultPath}`;

  if (templateId === "evaluation_followup_2") {
    return {
      subject: "Want a more accurate evaluation?",
      html: `
<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.55;color:#111;max-width:560px;">
  <p>Hi ${escapeHtml(name)},</p>
  <p>Quick note from ${BASE.brand}: the online estimate you received is a useful starting point — many homeowners also want a <strong>broker-backed market opinion</strong> using recent comparables.</p>
  <p>If that would help, you can book a short, no-obligation conversation here:</p>
  <p><a href="${escapeHtml(consultUrl)}" style="color:#0B0B0B;background:#D4AF37;padding:10px 18px;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block;">Request a precise evaluation</a></p>
  <p style="font-size:13px;color:#555;">— LECIPM</p>
</div>`,
    };
  }

  return {
    subject: "Free consultation available",
    html: `
<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.55;color:#111;max-width:560px;">
  <p>Hi ${escapeHtml(name)},</p>
  <p>Selling a home is a big decision. If you’d like clarity on pricing, timing, and marketing — <strong>a licensed broker can walk you through it for free</strong> (no pressure).</p>
  <p><a href="${escapeHtml(consultUrl)}" style="color:#0B0B0B;background:#D4AF37;padding:10px 18px;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block;">Book your free consultation</a></p>
  <p style="font-size:13px;color:#555;">Mohamed Al Mashhour · Residential Real Estate Broker (J1321) · ${BASE.brand}</p>
</div>`,
  };
}
