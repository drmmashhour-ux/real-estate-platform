import { prisma } from "@/lib/db";
import { getResend, isResendConfigured, getFromEmail } from "@/lib/email/resend";
import { logError } from "@/lib/logger";

export type MortgageBillingEmailKind =
  | "subscription_active"
  | "subscription_payment_failed"
  | "credits_purchased"
  | "commission_invoice";

export async function sendMortgageBillingEmail(opts: {
  expertId: string;
  kind: MortgageBillingEmailKind;
  extra?: { credits?: number; amountCents?: number; plan?: string; invoiceId?: string };
}): Promise<void> {
  if (!isResendConfigured()) return;
  const resend = getResend();
  if (!resend) return;

  const expert = await prisma.mortgageExpert.findUnique({
    where: { id: opts.expertId },
    select: { email: true, name: true },
  });
  if (!expert?.email) return;

  const { kind, extra } = opts;
  let subject = "Billing notification";
  let html = "<p>Thank you for using our platform.</p>";

  if (kind === "subscription_active") {
    subject = "Mortgage expert subscription confirmed";
    html = `<p>Hi ${escapeHtml(expert.name ?? "")},</p>
      <p>Your <strong>${escapeHtml(extra?.plan ?? "plan")}</strong> subscription is active.</p>
      <p>You can manage billing anytime in your expert dashboard.</p>`;
  } else if (kind === "subscription_payment_failed") {
    subject = "Action required: subscription payment failed";
    html = `<p>Hi ${escapeHtml(expert.name ?? "")},</p>
      <p>We couldn&apos;t process your subscription payment. Your account has been moved to the free tier and new lead routing is paused until billing is updated.</p>
      <p>Please update your payment method and resubscribe from the billing page.</p>`;
  } else if (kind === "credits_purchased") {
    subject = "Lead credits purchase confirmed";
    html = `<p>Hi ${escapeHtml(expert.name ?? "")},</p>
      <p>We added <strong>${extra?.credits ?? 0}</strong> pay-per-lead credits to your account.</p>`;
  } else if (kind === "commission_invoice") {
    subject = "Commission summary — mortgage deal";
    html = `<p>Hi ${escapeHtml(expert.name ?? "")},</p>
      <p>A commission record was generated for your closed deal. Reference: <code>${escapeHtml(extra?.invoiceId ?? "")}</code></p>`;
  }

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: expert.email,
      subject,
      html,
    });
  } catch (e) {
    logError("Mortgage billing email failed", e);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
