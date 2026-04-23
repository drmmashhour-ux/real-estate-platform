import type { NotificationPreference } from "@prisma/client";

export class NotificationComplianceError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "NotificationComplianceError";
    this.code = code;
  }
}

export function assertUserConsentForNotifications(pref: Pick<NotificationPreference, "consentGranted">): void {
  if (!pref.consentGranted) {
    throw new NotificationComplianceError("USER_CONSENT_REQUIRED");
  }
}

/** Required when email channel is enabled for outbound alerts. */
export function assertEmailOptInForAlerts(pref: Pick<NotificationPreference, "emailOptIn">): void {
  if (!pref.emailOptIn) {
    throw new NotificationComplianceError("EMAIL_OPT_IN_REQUIRED");
  }
}

/** SMS requires a verified phone on the user account. */
export function assertSmsPhoneVerified(hasVerifiedPhone: boolean): void {
  if (!hasVerifiedPhone) {
    throw new NotificationComplianceError("PHONE_VERIFICATION_REQUIRED");
  }
}

/** SMS channel opt-in (STOP compliance handled in copy + Twilio). */
export function assertSmsOptIn(pref: Pick<NotificationPreference, "smsOptIn">): void {
  if (!pref.smsOptIn) {
    throw new NotificationComplianceError("SMS_OPT_IN_REQUIRED");
  }
}
