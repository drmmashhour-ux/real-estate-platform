import { createClient } from "@supabase/supabase-js";
import { NotificationPriority, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logError, logWarn } from "@/lib/logger";
import { isResendConfigured, sendEmail } from "@/lib/email/resend";
import { createBnhubMobileNotification } from "@/lib/bnhub/mobile-push";
import { insertBnhubHostNotification } from "@/lib/bnhub/supabase-host-notifications";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function resolveHostEmail(hostSupabaseUserId: string): Promise<string | null> {
  const admin = supabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.auth.admin.getUserById(hostSupabaseUserId);
  if (error || !data.user?.email) return null;
  const e = data.user.email.trim();
  return e.includes("@") ? e : null;
}

/**
 * Prisma user id for push + in-app Notification rows (when host linked by id or email).
 */
export async function resolvePrismaUserIdForSupabaseHost(hostSupabaseUserId: string): Promise<string | null> {
  const hid = hostSupabaseUserId.trim();
  if (!hid) return null;

  const byId = await prisma.user.findUnique({ where: { id: hid }, select: { id: true } }).catch(() => null);
  if (byId) return byId.id;

  const email = await resolveHostEmail(hid);
  if (!email) return null;
  const byEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } }).catch(() => null);
  return byEmail?.id ?? null;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendBnhubHostTransactionalEmail(params: {
  to: string;
  subject: string;
  htmlBody: string;
}): Promise<void> {
  if (!isResendConfigured()) return;
  const to = params.to.trim();
  if (!to.includes("@")) return;
  await sendEmail({ to, subject: params.subject, html: params.htmlBody });
}

/**
 * Supabase inbox row + optional Prisma notification/push + optional host email.
 */
export async function notifyBnhubSupabaseHost(input: {
  hostSupabaseUserId: string;
  type: string;
  title: string;
  message: string;
  bookingId?: string | null;
  emailSubject?: string;
  emailHtml?: string;
}): Promise<void> {
  const hostId = input.hostSupabaseUserId.trim();
  if (!hostId) return;

  const inserted = await insertBnhubHostNotification({
    hostUserId: hostId,
    type: input.type,
    title: input.title,
    message: input.message,
    bookingId: input.bookingId ?? null,
  });

  if (!inserted.ok && "error" in inserted && inserted.error) {
    logWarn("[bnhub] host notification insert failed", { error: inserted.error });
  }

  const prismaUserId = await resolvePrismaUserIdForSupabaseHost(hostId);
  if (prismaUserId) {
    void createBnhubMobileNotification({
      userId: prismaUserId,
      title: input.title,
      message: input.message,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.NORMAL,
      actionUrl: input.bookingId ? `/host/bookings/${input.bookingId}` : null,
      actionLabel: input.bookingId ? "Open booking" : null,
      metadata: { bnhubSupabaseBookingId: input.bookingId ?? undefined, source: "supabase_bnhub" },
      pushData: { type: "bnhub_host", bookingId: input.bookingId ?? "" },
    }).catch((e) => logError("[bnhub] prisma host push failed", e));
  }

  const html = input.emailHtml?.trim();
  const subj = input.emailSubject?.trim();
  if (html && subj) {
    const to = await resolveHostEmail(hostId);
    if (to) {
      void sendBnhubHostTransactionalEmail({
        to,
        subject: subj,
        htmlBody: html,
      }).catch((e) => logError("[bnhub] host email failed", e));
    }
  }
}

export async function notifyHostForGuestCheckoutStarted(params: {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  hostSupabaseUserId: string;
}): Promise<void> {
  const msg = `A guest opened checkout for “${params.listingTitle}”.`;
  await notifyBnhubSupabaseHost({
    hostSupabaseUserId: params.hostSupabaseUserId,
    type: "checkout_started",
    title: "Checkout started",
    message: msg,
    bookingId: params.bookingId,
    emailSubject: `BNHUB: guest checking out — ${params.listingTitle}`,
    emailHtml: `<p>${escapeHtml(msg)}</p><ul><li><strong>Booking:</strong> ${escapeHtml(params.bookingId)}</li><li><strong>Listing:</strong> ${escapeHtml(params.listingTitle)}</li></ul>`,
  });
}

export async function notifyHostForGuestPaymentCaptured(params: {
  bookingId: string;
  listingTitle: string;
  hostSupabaseUserId: string;
  totalDisplay: string;
  datesSummary: string;
}): Promise<void> {
  const msg = `Payment received for “${params.listingTitle}” (${params.totalDisplay}).`;
  await notifyBnhubSupabaseHost({
    hostSupabaseUserId: params.hostSupabaseUserId,
    type: "payment_success",
    title: "Payment received",
    message: msg,
    bookingId: params.bookingId,
    emailSubject: `BNHUB: booking paid — ${params.listingTitle}`,
    emailHtml: `<p><strong>Payment received</strong> for your listing.</p>
      <ul>
        <li><strong>Booking:</strong> ${escapeHtml(params.bookingId)}</li>
        <li><strong>Listing:</strong> ${escapeHtml(params.listingTitle)}</li>
        <li><strong>Total:</strong> ${escapeHtml(params.totalDisplay)}</li>
        <li><strong>Dates:</strong> ${escapeHtml(params.datesSummary)}</li>
      </ul>
      <p style="color:#666;font-size:12px;">Payout timing follows your BNHUB / Stripe setup.</p>`,
  });
}
