import { prisma } from "@/lib/db";
import { POINTS, userEntityIdFromIpFingerprint } from "@/lib/fraud/rules";
import { recordFraudSignal } from "@/lib/fraud/record-signal";

const DAY_MS = 24 * 60 * 60 * 1000;

/** After a failed login attempt (known or unknown user). */
export async function evaluateUserFraudAfterFailedLogin(params: {
  userId?: string | null;
  ipFingerprint: string;
}): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const entityId = params.userId ?? userEntityIdFromIpFingerprint(params.ipFingerprint);
  const n = await prisma.platformEvent.count({
    where: {
      eventType: "auth_login_failure",
      entityId: `fp:${params.ipFingerprint}`,
      createdAt: { gte: since },
    },
  });
  if (n >= 6) {
    await recordFraudSignal({
      entityType: "user",
      entityId,
      signalType: "failed_login_burst",
      riskPoints: POINTS.failed_login_burst,
      metadataJson: { count1h: n },
    });
  }
}

/** After successful signup. */
export async function evaluateUserFraudAfterSignup(params: { userId: string; ipFingerprint: string }): Promise<void> {
  const since = new Date(Date.now() - DAY_MS);
  const signups = await prisma.platformEvent.count({
    where: {
      eventType: "auth_signup_attempt",
      entityId: `fp:${params.ipFingerprint}`,
      createdAt: { gte: since },
    },
  });
  if (signups >= 4) {
    await recordFraudSignal({
      entityType: "user",
      entityId: params.userId,
      signalType: "rapid_signup_same_ip",
      riskPoints: POINTS.rapid_signup_same_ip,
      metadataJson: { signups24h: signups },
    });
  }
}

/** When messaging/contact abuse was persisted. */
export async function evaluateUserFraudFromMessagingSignals(ipFingerprint: string): Promise<void> {
  const since = new Date(Date.now() - DAY_MS);
  const n = await prisma.platformEvent.count({
    where: {
      eventType: "security_repeated_messaging_abuse",
      entityId: `fp:${ipFingerprint}`,
      createdAt: { gte: since },
    },
  });
  if (n >= 3) {
    await recordFraudSignal({
      entityType: "user",
      entityId: userEntityIdFromIpFingerprint(ipFingerprint),
      signalType: "messaging_spam_burst",
      riskPoints: POINTS.messaging_contact_spam,
      metadataJson: { events24h: n },
    });
  }
}
