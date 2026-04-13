import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { getLegalEmailFooter } from "@/lib/email/notifications";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";
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

/**
 * Sends listing confirmation (optional email), dashboard notification, and mobile push
 * when an FSBO listing first goes live. Idempotent via `sellerActivationNotifiedAt`.
 * Email is skipped when `LISTING_LIFECYCLE_EMAILS_ENABLED=false`.
 */
export async function notifyFsboListingActivatedIfNeeded(fsboListingId: string): Promise<void> {
  const emailEnabled = isListingLifecycleEmailEnabled();
  const row = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: {
      id: true,
      status: true,
      title: true,
      city: true,
      propertyType: true,
      listingCode: true,
      sellerActivationNotifiedAt: true,
      ownerId: true,
      owner: { select: { email: true, name: true } },
    },
  });

  if (!row || row.status !== "ACTIVE" || row.sellerActivationNotifiedAt) {
    return;
  }
  const to = row.owner.email?.trim();
  if (emailEnabled && !to) {
    logError("listing_activation_notify_skip", { reason: "no_owner_email", fsboListingId });
    return;
  }

  const base = getPublicAppUrl();
  const publicPath = buildFsboPublicListingPath({
    id: row.id,
    city: row.city,
    propertyType: row.propertyType,
  });
  const publicUrl = `${base}${publicPath}`;
  const dashboardUrl = `${base}/dashboard/fsbo`;
  const brochureUrl = `${base}/api/listings/${encodeURIComponent(fsboListingId)}/brochure`;
  const codeLine = row.listingCode?.trim()
    ? `<p style="margin:1em 0"><strong>Listing code:</strong> ${escapeHtml(row.listingCode.trim())}</p>`
    : "";

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#111;max-width:560px">
<p style="font-size:18px;font-weight:600;color:#0f172a">Your listing is live on LECIPM</p>
<p>Hi ${escapeHtml(row.owner.name?.trim() || "there")},</p>
<p>Congratulations — <strong>${escapeHtml(row.title)}</strong> is now published. Use your listing code and dashboard to track every movement: visits, inquiries, and deal milestones.</p>
${codeLine}
<p><a href="${escapeHtml(publicUrl)}" style="color:#0d9488;font-weight:600">View public listing</a></p>
<p><a href="${escapeHtml(dashboardUrl)}" style="color:#0d9488;font-weight:600">Open seller dashboard</a> — manage photos, price, and notifications.</p>
<p><a href="${escapeHtml(brochureUrl)}" style="color:#0d9488">Open print-friendly summary</a> — use your browser’s print dialog to save as PDF if you like.</p>
<p style="font-size:14px;color:#444">Tip: enable email and app alerts in your account settings so you never miss buyer activity.</p>
${getLegalEmailFooter()}
</body></html>`;

  if (emailEnabled && to) {
    const ok = await sendTransactionalEmail({
      to,
      subject: `Listing confirmed — ${row.listingCode ?? row.title.slice(0, 48)} · LECIPM`,
      html,
      template: "fsbo_listing_activated",
    });
    if (!ok) {
      logError("listing_activation_email_failed", { fsboListingId });
      return;
    }
  }

  try {
    await prisma.fsboListing.update({
      where: { id: fsboListingId },
      data: { sellerActivationNotifiedAt: new Date() },
    });
  } catch (e) {
    logError("listing_activation_timestamp_failed", e);
    return;
  }

  const shortCode = row.listingCode?.trim() ?? row.title.slice(0, 40);
  void createNotification({
    userId: row.ownerId,
    type: NotificationType.SYSTEM,
    title: "Listing published",
    message: `${row.title} is live. Code ${shortCode} — track activity in your dashboard.`,
    actionUrl: dashboardUrl,
    actionLabel: "Seller dashboard",
    listingId: fsboListingId,
    metadata: { kind: "seller_listing_activated", listingCode: row.listingCode },
  }).catch(() => {});

  void sendBnhubPushToUser({
    userId: row.ownerId,
    title: "Listing live on LECIPM",
    body: `${row.title} — open your dashboard for updates.`,
    data: { kind: "seller_listing_activated", fsboListingId, listingCode: row.listingCode ?? "" },
  }).catch(() => {});

  logInfo("listing_activation_notified", { fsboListingId, ownerId: row.ownerId });
}
