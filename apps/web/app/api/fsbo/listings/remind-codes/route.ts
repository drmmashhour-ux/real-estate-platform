import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { getLegalEmailFooter } from "@/lib/email/notifications";
import { getPublicAppUrl } from "@/lib/config/public-app-url";
import { isListingLifecycleEmailEnabled } from "@/lib/listing-lifecycle/config";
import { logError, logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * POST — email the signed-in user a list of their FSBO listing codes (recovery / forgot code).
 */
export async function POST() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email?.trim()) {
    return Response.json({ error: "No email on account" }, { status: 400 });
  }

  const listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: {
      id: true,
      title: true,
      listingCode: true,
      status: true,
      city: true,
      updatedAt: true,
    },
  });

  const rows = listings
    .filter((l) => l.listingCode?.trim())
    .map(
      (l) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-size:13px">${escapeHtml(l.listingCode!.trim())}</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(l.title)}</td><td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#555">${escapeHtml(l.status)} · ${escapeHtml(l.city ?? "")}</td></tr>`
    )
    .join("");

  const base = getPublicAppUrl();
  const listUrl = `${base}/dashboard/seller/listings`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#111;max-width:560px">
<p style="font-size:18px;font-weight:600;color:#0f172a">Your LECIPM listing codes</p>
<p>Hi ${escapeHtml(user.name?.trim() || "there")},</p>
<p>You asked for a reminder of your listing reference codes. Use them when talking to support, or find every file anytime under <a href="${escapeHtml(listUrl)}">My listings</a> while signed in.</p>
<table style="width:100%;border-collapse:collapse;margin:1em 0"><thead><tr><th align="left" style="padding:8px;border-bottom:2px solid #ccc">Code</th><th align="left" style="padding:8px;border-bottom:2px solid #ccc">Title</th><th align="left" style="padding:8px;border-bottom:2px solid #ccc">Status</th></tr></thead><tbody>${
    rows || `<tr><td colspan="3" style="padding:12px;color:#666">No listing codes found yet.</td></tr>`
  }</tbody></table>
<p style="font-size:14px;color:#444">Continue any draft: open <a href="${escapeHtml(listUrl)}">My listings</a> — no code needed when you’re logged in.</p>
${getLegalEmailFooter()}
</body></html>`;

  const emailEnabled = isListingLifecycleEmailEnabled();
  if (emailEnabled) {
    const ok = await sendTransactionalEmail({
      to: user.email.trim(),
      subject: "Your LECIPM listing codes",
      html,
      template: "fsbo_listing_codes_reminder",
    });
    if (!ok) {
      logError("remind_codes_email_failed", { userId });
      return Response.json({ ok: false, error: "Email could not be sent. Try again later." }, { status: 503 });
    }
  } else {
    logInfo("remind_codes_skip_email", { userId, reason: "lifecycle_emails_disabled" });
  }

  return Response.json({ ok: true, count: listings.filter((l) => l.listingCode?.trim()).length });
}
