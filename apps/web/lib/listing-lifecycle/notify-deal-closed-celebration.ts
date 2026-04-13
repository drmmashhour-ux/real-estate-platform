import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { getLegalEmailFooter } from "@/lib/email/notifications";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { createNotification } from "@/modules/notifications/services/create-notification";
import { sendBnhubPushToUser } from "@/lib/bnhub/mobile-push";
import { logError, logInfo } from "@/lib/logger";
import { NotificationType } from "@prisma/client";
import { isListingLifecycleEmailEnabled } from "@/lib/listing-lifecycle/config";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function resolvePropertyLabel(listingId: string | null): Promise<string> {
  if (!listingId) return "the property";
  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { title: true },
  });
  if (fsbo) return fsbo.title;
  const crm = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { title: true },
  });
  return crm?.title?.trim() || "the property";
}

function cadMoney(cents: number): string {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

/**
 * Optional emails + in-app + push for buyer, seller, and broker when a deal first reaches `closed`.
 * Idempotent via `saleCelebrationNotifiedAt` on the deal row.
 * Email skipped when `LISTING_LIFECYCLE_EMAILS_ENABLED=false`.
 */
export async function notifyDealClosedCelebrationIfNeeded(dealId: string): Promise<void> {
  const emailEnabled = isListingLifecycleEmailEnabled();
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      status: true,
      priceCents: true,
      listingId: true,
      saleCelebrationNotifiedAt: true,
      buyerId: true,
      sellerId: true,
      brokerId: true,
      buyer: { select: { email: true, name: true } },
      seller: { select: { email: true, name: true } },
      broker: { select: { email: true, name: true } },
    },
  });

  if (!deal || deal.status !== "closed" || deal.saleCelebrationNotifiedAt) {
    return;
  }

  const propertyLabel = await resolvePropertyLabel(deal.listingId);
  const base = getPublicAppUrl();
  const dealUrl = `${base}/deal/${encodeURIComponent(deal.id)}`;
  const priceLabel = cadMoney(deal.priceCents);

  const footer = getLegalEmailFooter();

  const emails: Array<{ to: string; subject: string; html: string; role: "buyer" | "seller" | "broker" }> = [];

  if (deal.buyer.email?.trim()) {
    emails.push({
      to: deal.buyer.email.trim(),
      subject: `Congratulations — your purchase of ${propertyLabel.slice(0, 60)}`,
      html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.55;color:#111;max-width:560px">
<p style="font-size:18px;font-weight:600;color:#0f172a">Congratulations from LECIPM</p>
<p>Hi ${escapeHtml(deal.buyer.name?.trim() || "there")},</p>
<p>Your file for <strong>${escapeHtml(propertyLabel)}</strong> is marked <strong>sold</strong> at ${escapeHtml(priceLabel)}. The platform sends this digital greeting to celebrate your purchase.</p>
<p><a href="${escapeHtml(dealUrl)}" style="color:#0d9488;font-weight:600">Open your deal</a> for documents and next steps.</p>
${footer}
</body></html>`,
      role: "buyer",
    });
  }

  if (deal.seller.email?.trim()) {
    emails.push({
      to: deal.seller.email.trim(),
      subject: `Congratulations — sale of ${propertyLabel.slice(0, 60)}`,
      html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.55;color:#111;max-width:560px">
<p style="font-size:18px;font-weight:600;color:#0f172a">Congratulations from LECIPM</p>
<p>Hi ${escapeHtml(deal.seller.name?.trim() || "there")},</p>
<p><strong>${escapeHtml(propertyLabel)}</strong> is recorded as <strong>sold</strong> at ${escapeHtml(priceLabel)}. Thank you for listing on the platform — your dashboard keeps a full trail of this file.</p>
<p><a href="${escapeHtml(dealUrl)}" style="color:#0d9488;font-weight:600">View deal summary</a></p>
${footer}
</body></html>`,
      role: "seller",
    });
  }

  if (deal.broker?.email?.trim()) {
    emails.push({
      to: deal.broker.email.trim(),
      subject: `Deal closed — ${propertyLabel.slice(0, 50)}`,
      html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.55;color:#111;max-width:560px">
<p style="font-size:18px;font-weight:600;color:#0f172a">Congratulations — deal closed</p>
<p>Hi ${escapeHtml(deal.broker.name?.trim() || "there")},</p>
<p>The sale for <strong>${escapeHtml(propertyLabel)}</strong> is marked <strong>closed</strong> at ${escapeHtml(priceLabel)}. LECIPM sends this note so your pipeline and compliance trail stay complete.</p>
<p><a href="${escapeHtml(dealUrl)}" style="color:#0d9488;font-weight:600">Open deal</a></p>
${footer}
</body></html>`,
      role: "broker",
    });
  }

  if (emailEnabled) {
    let allOk = true;
    for (const e of emails) {
      const ok = await sendTransactionalEmail({
        to: e.to,
        subject: e.subject,
        html: e.html,
        template: `deal_closed_${e.role}`,
      });
      if (!ok) allOk = false;
    }
    if (!allOk) {
      logError("deal_closed_celebration_partial_email_failure", { dealId });
      return;
    }
  }

  try {
    await prisma.deal.update({
      where: { id: dealId },
      data: { saleCelebrationNotifiedAt: new Date() },
    });
  } catch (e) {
    logError("deal_closed_celebration_timestamp_failed", e);
    return;
  }

  const pushTitle = "Sale recorded — congratulations";
  const pushBody = `${propertyLabel} · ${priceLabel}`;

  const notifyUser = (userId: string) => {
    void createNotification({
      userId,
      type: NotificationType.CRM,
      title: pushTitle,
      message: `Closed: ${propertyLabel} at ${priceLabel}.`,
      actionUrl: dealUrl,
      actionLabel: "View deal",
      listingId: deal.listingId ?? undefined,
      metadata: { kind: "deal_closed_celebration", dealId },
    }).catch(() => {});
    void sendBnhubPushToUser({
      userId,
      title: pushTitle,
      body: pushBody,
      data: { kind: "deal_closed", dealId, listingId: deal.listingId ?? "" },
    }).catch(() => {});
  };

  notifyUser(deal.buyerId);
  notifyUser(deal.sellerId);
  if (deal.brokerId) notifyUser(deal.brokerId);

  logInfo("deal_closed_celebration_sent", { dealId });
}
