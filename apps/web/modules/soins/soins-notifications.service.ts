import { dispatchBusinessEventToChannels } from "@/modules/notifications/notification-router.service";
import { sendTransactionalEmail } from "@/modules/notifications/notify";
import { sendSmsViaTwilio } from "@/modules/notifications/sms.service";
import { sendExpoPushToUserIds } from "@/modules/notifications/push.service";
import { prisma } from "@/lib/db";
import type { CareHubEventKind, CareHubEventSeverity } from "@prisma/client";

function mapDbSeverityToPlatform(
  s: CareHubEventSeverity,
): "LOW" | "MEDIUM" | "HIGH" {
  return s;
}

/**
 * After a care event is stored, fan out: family (push + email), platform (admin) for higher signal.
 */
export async function fanOutCareEventNotification(input: {
  residentId: string;
  type: CareHubEventKind;
  message: string;
  severity: CareHubEventSeverity;
  alertCode?: string;
}): Promise<void> {
  const sev = input.severity;
  const platSev = mapDbSeverityToPlatform(sev);

  const familyRecipients = await prisma.familyAccess.findMany({
    where: {
      residentId: input.residentId,
      canReceiveAlerts: true,
    },
    select: {
      familyUserId: true,
      familyUser: { select: { email: true, phone: true } },
    },
  });

  const title =
    input.type === "EMERGENCY"
      ? "LECIPM Soins · Emergency"
      : input.type === "HEALTH"
        ? "LECIPM Soins · Health"
        : "LECIPM Soins · Alert";

  const body = `${input.message}${input.alertCode ? ` (${input.alertCode})` : ""}`;

  const ids = familyRecipients.map((r) => r.familyUserId);
  await sendExpoPushToUserIds(ids, title, body, {
    hub: "soins",
    residentId: input.residentId,
    eventType: input.type,
    severity: sev,
  });

  const smsWorthy =
    input.type === "EMERGENCY" || input.severity === "HIGH";

  for (const r of familyRecipients) {
    const email = r.familyUser.email?.trim();
    if (email?.includes("@")) {
      await sendTransactionalEmail(email, title, `${body}\n\n— LECIPM Soins`).catch(() => undefined);
    }
    const phone = r.familyUser.phone?.trim();
    if (smsWorthy && phone && /^\+[1-9]\d{6,14}$/.test(phone)) {
      await sendSmsViaTwilio(phone, `${title}: ${body}`.slice(0, 480)).catch(() => undefined);
    }
  }

  const isEmergency = input.type === "EMERGENCY";
  const isMissedMedication =
    input.type === "HEALTH" &&
    /\b(med|medication|dose|medicament)\b/i.test(input.message) &&
    /\b(miss|missed|skipped|late)\b/i.test(input.message);

  const abnormalActivity =
    input.type === "MOVEMENT" &&
    /\b(abnormal|unusual|unexpected|idle|stationary)\b/i.test(input.message);

  if (isEmergency) {
    await dispatchBusinessEventToChannels({
      type: "SOINS_EMERGENCY",
      residentId: input.residentId,
      detail: input.message,
    });
    return;
  }

  await dispatchBusinessEventToChannels({
    type: "SOINS_CARE_ALERT",
    residentId: input.residentId,
    severity: platSev,
    alertCode:
      input.alertCode ??
      (isMissedMedication
        ? "MISSED_MEDICATION"
        : abnormalActivity
          ? "ABNORMAL_ACTIVITY"
          : input.type === "ALERT"
            ? "MANUAL_ALERT"
            : undefined),
    detail: input.message,
  });
}
