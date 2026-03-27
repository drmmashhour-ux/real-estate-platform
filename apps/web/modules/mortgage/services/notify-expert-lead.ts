import { prisma } from "@/lib/db";
import { sendDashboardNotification, sendEmailNotification } from "@/lib/notifications";

function formatMoney(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

/**
 * Notify assigned expert when a mortgage lead is created (in-app + email).
 */
export async function notifyMortgageExpertNewLead(params: {
  expertId: string;
  leadId: string;
  clientName: string;
  clientEmail: string;
  purchasePrice?: number;
  downPayment?: number;
}): Promise<void> {
  const expert = await prisma.mortgageExpert.findUnique({
    where: { id: params.expertId },
    select: { email: true, name: true, isActive: true, acceptedTerms: true },
  });
  if (!expert?.email || !expert.isActive || !expert.acceptedTerms) return;

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const dashboardUrl = `${base}/dashboard/expert/leads`;

  const estMortgage =
    params.purchasePrice != null &&
    Number.isFinite(params.purchasePrice) &&
    params.downPayment != null &&
    Number.isFinite(params.downPayment)
      ? Math.max(0, params.purchasePrice - params.downPayment)
      : params.purchasePrice != null && Number.isFinite(params.purchasePrice)
        ? params.purchasePrice
        : undefined;

  const detailLines = [
    `Client email: ${params.clientEmail}`,
    `Property price (est.): ${formatMoney(params.purchasePrice)}`,
    `Estimated mortgage (price − down payment when provided): ${formatMoney(estMortgage)}`,
  ].join("\n");

  void sendDashboardNotification({
    mortgageExpertId: params.expertId,
    leadId: params.leadId,
    kind: "mortgage_lead",
    title: "New mortgage lead received",
    body: `${params.clientName}\n${detailLines}`,
  });

  await sendEmailNotification({
    to: expert.email,
    subject: `New mortgage lead — ${params.clientName}`,
    html: `
<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#111;max-width:560px;">
  <p>Hi ${expert.name || "there"},</p>
  <p><strong>New mortgage lead received</strong> on the platform.</p>
  <p><strong>${params.clientName}</strong><br/>${params.clientEmail}</p>
  <p><strong>Property price (est.):</strong> ${formatMoney(params.purchasePrice)}<br/>
  <strong>Estimated mortgage:</strong> ${formatMoney(estMortgage)}</p>
  <p style="margin-top:1.5em;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#C9A646;color:#0B0B0B;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:10px;">View lead</a>
  </p>
  <p style="margin-top:1.5em;font-size:13px;color:#666;">Lead ID: ${params.leadId}</p>
</div>`,
  }).catch(() => {});
}
