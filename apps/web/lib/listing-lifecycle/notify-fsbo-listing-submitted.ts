import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { getLegalEmailFooter } from "@/lib/email/notifications";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { createNotification } from "@/modules/notifications/services/create-notification";
import { NotificationType } from "@prisma/client";
import { logError, logInfo } from "@/lib/logger";
import { isListingLifecycleEmailEnabled } from "@/lib/listing-lifecycle/config";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email + in-app notice after seller submits for verification (queue for admin review).
 */
export async function notifyFsboListingSubmittedForReview(fsboListingId: string): Promise<void> {
  const emailEnabled = isListingLifecycleEmailEnabled();
  const row = await prisma.fsboListing.findUnique({
    where: { id: fsboListingId },
    select: {
      id: true,
      title: true,
      listingCode: true,
      status: true,
      ownerId: true,
      owner: { select: { email: true, name: true } },
    },
  });
  if (!row || row.status !== "PENDING_VERIFICATION") {
    return;
  }
  const to = row.owner.email?.trim();
  const base = getPublicAppUrl();
  const manageUrl = `${base}/dashboard/seller/listings/${encodeURIComponent(row.id)}`;
  const code = row.listingCode?.trim() ?? "";

  const codeLine = code
    ? `<p style="margin:1em 0"><strong>Your listing code:</strong> ${escapeHtml(code)}</p>
<p style="font-size:14px;color:#444">Save this code — it appears on your “My listings” page and helps support find your file. Signed-in sellers can always continue from the dashboard without the code.</p>`
    : "";

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#111;max-width:560px">
<p style="font-size:18px;font-weight:600;color:#0f172a">Listing submitted for review</p>
<p>Hi ${escapeHtml(row.owner.name?.trim() || "there")},</p>
<p>We received <strong>${escapeHtml(row.title)}</strong> for platform verification. Our team will review documents and declarations; you’ll get another message when the listing is published or if we need changes.</p>
${codeLine}
<p><a href="${escapeHtml(manageUrl)}" style="color:#0d9488;font-weight:600">Open this listing</a> to upload anything you still owe or check status.</p>
${getLegalEmailFooter()}
</body></html>`;

  if (emailEnabled && to) {
    const ok = await sendTransactionalEmail({
      to,
      subject: `Submitted for review — ${code || row.title.slice(0, 40)} · LECIPM`,
      html,
      template: "fsbo_listing_submitted",
    });
    if (!ok) {
      logError("fsbo_submitted_email_failed", { fsboListingId });
    }
  }

  void createNotification({
    userId: row.ownerId,
    type: NotificationType.SYSTEM,
    title: "Listing in review",
    message: `${row.title} — ${code ? `Code ${code}. ` : ""}We’ll notify you when it’s live.`,
    actionUrl: manageUrl,
    actionLabel: "View listing",
    listingId: fsboListingId,
    metadata: { kind: "seller_listing_submitted", listingCode: row.listingCode },
  }).catch(() => {});

  logInfo("fsbo_submitted_notified", { fsboListingId, ownerId: row.ownerId });
}
