/**
 * Retention touches — rate-limited, opt-in aligned with `NotificationPreference` + BNHub prefs.
 */
import { prisma } from "@/lib/db";
import {
  assertEmailOptInForAlerts,
  assertUserConsentForNotifications,
  NotificationComplianceError,
} from "@/lib/notifications/compliance";
import { sendEmailNotification } from "@/lib/notifications/email";
import { isQuietHours } from "@/lib/notifications/quiet-hours";
import { isWebPushConfigured, sendPushNotification } from "@/lib/notifications/push";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import type { RetentionTouchType } from "./types";

const OWNER_USER = "user";
export const RETENTION_EMAIL_TITLE_PREFIX = "[BNHub Retention]";

function maxEmailsPerWeek(): number {
  const raw = process.env.RETENTION_MAX_EMAILS_PER_WEEK?.trim();
  const n = raw ? Number(raw) : 2;
  return Number.isFinite(n) && n >= 0 ? Math.min(10, n) : 2;
}

export async function countRetentionEmailsSince(userId: string, since: Date): Promise<number> {
  return prisma.notificationLog.count({
    where: {
      ownerType: OWNER_USER,
      ownerId: userId,
      channel: "email",
      title: { startsWith: RETENTION_EMAIL_TITLE_PREFIX },
      createdAt: { gte: since },
    },
  });
}

type NurtureGate = { ok: true; pref: NonNullable<Awaited<ReturnType<typeof loadPref>>> } | { ok: false; reason: string };

async function loadPref(userId: string) {
  return prisma.notificationPreference.findUnique({
    where: { ownerType_ownerId: { ownerType: OWNER_USER, ownerId: userId } },
  });
}

/** BNHub prefs JSON: `{ "retentionNurtureDisabled": true }` opts out of nurture emails/push. */
export async function isRetentionNurtureDisabledInBnhubPrefs(userId: string): Promise<boolean> {
  const row = await prisma.userBnhubPreferences.findUnique({
    where: { userId },
    select: { prefsJson: true },
  });
  const j = row?.prefsJson;
  if (!j || typeof j !== "object" || Array.isArray(j)) return false;
  return (j as { retentionNurtureDisabled?: boolean }).retentionNurtureDisabled === true;
}

export async function gateRetentionNurture(userId: string): Promise<NurtureGate> {
  const max = maxEmailsPerWeek();
  if (max === 0) return { ok: false, reason: "RETENTION_EMAILS_DISABLED" };

  if (await isRetentionNurtureDisabledInBnhubPrefs(userId)) {
    return { ok: false, reason: "USER_OPTED_OUT_BNHUB_PREFS" };
  }

  const since = new Date(Date.now() - 7 * 86_400_000);
  const sent = await countRetentionEmailsSince(userId, since);
  if (sent >= max) {
    return { ok: false, reason: "WEEKLY_RATE_LIMIT" };
  }

  const pref = await loadPref(userId);
  if (!pref) return { ok: false, reason: "NO_NOTIFICATION_PREFERENCES" };
  if (!pref.emailEnabled) return { ok: false, reason: "EMAIL_CHANNEL_OFF" };

  try {
    assertUserConsentForNotifications(pref);
    assertEmailOptInForAlerts(pref);
  } catch (e) {
    const code = e instanceof NotificationComplianceError ? e.code : "COMPLIANCE";
    return { ok: false, reason: code };
  }

  if (isQuietHours(pref)) return { ok: false, reason: "QUIET_HOURS" };

  return { ok: true, pref };
}

export async function sendRetentionNurtureEmail(params: {
  userId: string;
  touchType: RetentionTouchType;
  title: string;
  body: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const gate = await gateRetentionNurture(params.userId);
  if (!gate.ok) return { sent: false, reason: gate.reason };

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true },
  });
  const to = gate.pref.emailAddress?.trim() || user?.email;
  if (!to) return { sent: false, reason: "NO_EMAIL_ADDRESS" };

  const fullTitle = `${RETENTION_EMAIL_TITLE_PREFIX} ${params.title}`;
  const message = `${params.body}\n\n---\nWhy you’re seeing this: ${params.touchType} (BNHub retention — not a transactional booking message). You can turn these off in notification settings or set \"retentionNurtureDisabled\": true in BNHub preferences.`;

  try {
    const ok = await sendEmailNotification({
      ownerType: OWNER_USER,
      ownerId: params.userId,
      to,
      title: fullTitle,
      message,
    });
    await recordAuditEvent({
      actorUserId: params.userId,
      action: "RETENTION_NURTURE_EMAIL",
      payload: { touchType: params.touchType, ok },
    });
    return { sent: ok };
  } catch (e) {
    const code = e instanceof NotificationComplianceError ? e.code : "SEND_FAILED";
    await recordAuditEvent({
      actorUserId: params.userId,
      action: "RETENTION_NURTURE_EMAIL_FAILED",
      payload: { touchType: params.touchType, code },
    });
    return { sent: false, reason: code };
  }
}

/** Push uses same BNHub opt-out; does not consume email weekly cap (separate soft cap). */
export async function sendRetentionNurturePush(params: {
  userId: string;
  touchType: RetentionTouchType;
  title: string;
  body: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (await isRetentionNurtureDisabledInBnhubPrefs(params.userId)) {
    return { sent: false, reason: "USER_OPTED_OUT_BNHUB_PREFS" };
  }

  const pref = await loadPref(params.userId);
  if (!pref?.pushEnabled) return { sent: false, reason: "PUSH_OFF" };
  if (!isWebPushConfigured()) return { sent: false, reason: "PUSH_NOT_CONFIGURED" };

  const pushCount = await prisma.pushSubscription.count({
    where: { ownerType: OWNER_USER, ownerId: params.userId },
  });
  if (pushCount === 0) return { sent: false, reason: "NO_PUSH_SUBSCRIPTIONS" };

  const since = new Date(Date.now() - 7 * 86_400_000);
  const recentPush = await prisma.notificationLog.count({
    where: {
      ownerType: OWNER_USER,
      ownerId: params.userId,
      channel: "push",
      title: { startsWith: RETENTION_EMAIL_TITLE_PREFIX },
      createdAt: { gte: since },
    },
  });
  const pushCap = Number(process.env.RETENTION_MAX_PUSH_PER_WEEK ?? "2");
  const cap = Number.isFinite(pushCap) && pushCap >= 0 ? Math.min(10, pushCap) : 2;
  if (recentPush >= cap) return { sent: false, reason: "PUSH_WEEKLY_RATE_LIMIT" };

  const fullTitle = `${RETENTION_EMAIL_TITLE_PREFIX} ${params.title}`;
  try {
    await sendPushNotification(
      OWNER_USER,
      params.userId,
      { title: fullTitle, body: params.body.slice(0, 220) },
      undefined
    );
    await recordAuditEvent({
      actorUserId: params.userId,
      action: "RETENTION_NURTURE_PUSH",
      payload: { touchType: params.touchType },
    });
    return { sent: true };
  } catch {
    return { sent: false, reason: "PUSH_SEND_FAILED" };
  }
}
