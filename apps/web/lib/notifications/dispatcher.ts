import type { WatchlistAlertType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { preferenceAllowsAlertType } from "@/lib/notifications/alert-type-prefs";
import {
  assertEmailOptInForAlerts,
  assertSmsOptIn,
  assertSmsPhoneVerified,
  assertUserConsentForNotifications,
  NotificationComplianceError,
} from "@/lib/notifications/compliance";
import { sendEmailNotification } from "@/lib/notifications/email";
import { isNotificationDeliveryV1Enabled } from "@/lib/notifications/flags";
import { isWebPushConfigured, sendPushNotification } from "@/lib/notifications/push";
import { isQuietHours } from "@/lib/notifications/quiet-hours";
import { sendSMSNotification } from "@/lib/notifications/sms";

const OWNER_USER = "user";

/**
 * Delivers a watchlist / investor alert through email, SMS, and web push per `NotificationPreference`.
 * No-ops when `LECIPM_NOTIFICATION_DELIVERY_V1` is not `"true"` (legacy paths unchanged).
 */
export async function dispatchWatchlistAlert(alertId: string): Promise<void> {
  if (!isNotificationDeliveryV1Enabled()) return;

  const alert = await prisma.watchlistAlert.findUnique({
    where: { id: alertId },
  });
  if (!alert) return;

  await recordAuditEvent({
    actorUserId: alert.userId,
    action: "NOTIFICATION_ALERT_TRIGGERED",
    payload: { alertId: alert.id, alertType: alert.alertType },
  });

  const pref = await prisma.notificationPreference.findUnique({
    where: {
      ownerType_ownerId: { ownerType: OWNER_USER, ownerId: alert.userId },
    },
  });

  if (!pref) {
    await recordAuditEvent({
      actorUserId: alert.userId,
      action: "NOTIFICATION_DISPATCH_SKIPPED",
      payload: { alertId: alert.id, reason: "NO_PREFERENCES" },
    });
    return;
  }

  try {
    assertUserConsentForNotifications(pref);
  } catch (e) {
    if (e instanceof NotificationComplianceError) {
      await recordAuditEvent({
        actorUserId: alert.userId,
        action: "NOTIFICATION_COMPLIANCE_BLOCKED",
        payload: { alertId: alert.id, code: e.code },
      });
    }
    return;
  }

  if (isQuietHours(pref)) {
    await recordAuditEvent({
      actorUserId: alert.userId,
      action: "NOTIFICATION_DISPATCH_SKIPPED",
      payload: { alertId: alert.id, reason: "QUIET_HOURS" },
    });
    return;
  }

  if (!preferenceAllowsAlertType(alert.alertType as WatchlistAlertType, pref)) {
    await recordAuditEvent({
      actorUserId: alert.userId,
      action: "NOTIFICATION_DISPATCH_SKIPPED",
      payload: { alertId: alert.id, reason: "ALERT_TYPE_DISABLED" },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: alert.userId },
    select: { email: true, phone: true, phoneVerifiedAt: true },
  });
  if (!user) return;

  const emailTo = pref.emailAddress?.trim() || user.email;
  const phoneTo = pref.phoneNumber?.trim() || user.phone;

  const common = {
    ownerType: OWNER_USER,
    ownerId: alert.userId,
    title: alert.title,
    message: alert.message,
    alertId: alert.id,
  };

  if (pref.emailEnabled && emailTo) {
    try {
      assertEmailOptInForAlerts(pref);
      const ok = await sendEmailNotification({ ...common, to: emailTo });
      await recordAuditEvent({
        actorUserId: alert.userId,
        action: ok ? "NOTIFICATION_SENT" : "NOTIFICATION_FAILED",
        payload: { alertId: alert.id, channel: "email", ...(ok ? {} : { code: "PROVIDER_ERROR" }) },
      });
    } catch (e) {
      const code = e instanceof NotificationComplianceError ? e.code : "SEND_ERROR";
      await recordAuditEvent({
        actorUserId: alert.userId,
        action: "NOTIFICATION_FAILED",
        payload: { alertId: alert.id, channel: "email", code },
      });
    }
  }

  if (pref.smsEnabled && phoneTo) {
    try {
      assertSmsOptIn(pref);
      assertSmsPhoneVerified(Boolean(user.phoneVerifiedAt));
      const ok = await sendSMSNotification({
        ownerType: OWNER_USER,
        ownerId: alert.userId,
        to: phoneTo,
        message: alert.message,
        alertId: alert.id,
      });
      await recordAuditEvent({
        actorUserId: alert.userId,
        action: ok ? "NOTIFICATION_SENT" : "NOTIFICATION_FAILED",
        payload: { alertId: alert.id, channel: "sms", ...(ok ? {} : { code: "PROVIDER_ERROR" }) },
      });
    } catch (e) {
      const code = e instanceof NotificationComplianceError ? e.code : "SEND_ERROR";
      await recordAuditEvent({
        actorUserId: alert.userId,
        action: "NOTIFICATION_FAILED",
        payload: { alertId: alert.id, channel: "sms", code },
      });
    }
  }

  if (pref.pushEnabled) {
    const pushCount = await prisma.pushSubscription.count({
      where: { ownerType: OWNER_USER, ownerId: alert.userId },
    });
    if (!isWebPushConfigured() || pushCount === 0) {
      await recordAuditEvent({
        actorUserId: alert.userId,
        action: "NOTIFICATION_DISPATCH_SKIPPED",
        payload: {
          alertId: alert.id,
          channel: "push",
          reason: !isWebPushConfigured() ? "VAPID_NOT_CONFIGURED" : "NO_PUSH_SUBSCRIPTIONS",
        },
      });
    } else {
      try {
        await sendPushNotification(OWNER_USER, alert.userId, { title: alert.title, body: alert.message }, alert.id);
        await recordAuditEvent({
          actorUserId: alert.userId,
          action: "NOTIFICATION_SENT",
          payload: { alertId: alert.id, channel: "push" },
        });
      } catch {
        await recordAuditEvent({
          actorUserId: alert.userId,
          action: "NOTIFICATION_FAILED",
          payload: { alertId: alert.id, channel: "push", code: "SEND_ERROR" },
        });
      }
    }
  }
}
