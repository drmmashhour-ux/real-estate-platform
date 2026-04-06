import { getNotificationEmail } from "@/lib/email/resend";

/**
 * Internal / test recipients for marketing email sends (comma-separated in env).
 * Falls back to notification email when unset.
 */
export function getMarketingEmailRecipients(): string[] {
  const raw = process.env.MARKETING_EMAIL_TO?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.includes("@"));
  }
  const fallback = getNotificationEmail()?.trim();
  return fallback && fallback.includes("@") ? [fallback] : [];
}

export function isMarketingEmailLiveSendEnabled(): boolean {
  return process.env.MARKETING_EMAIL_LIVE_SEND?.trim() === "1";
}

export function isMarketingSocialLiveEnabled(): boolean {
  return process.env.MARKETING_SOCIAL_LIVE_SEND?.trim() === "1";
}
