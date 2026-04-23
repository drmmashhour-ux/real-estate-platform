import { PrivacyConsentService } from "@/modules/compliance/consent.service";

/**
 * Gatekeeper for marketing and secondary-use communications.
 * Strictly aligned with Law 25 and OACIQ non-transactional rules.
 */
export async function canSendMarketing(userId: string): Promise<boolean> {
  // 1. Check for specific MARKETING consent
  const hasMarketingConsent = await PrivacyConsentService.hasActiveConsent({
    userId,
    purpose: "MARKETING",
  });

  if (!hasMarketingConsent) {
    console.warn(`[MARKETING_BLOCKED] User ${userId} has not granted marketing consent.`);
    return false;
  }

  // 2. Check for SECONDARY_USE consent (optional layer)
  const hasSecondaryUseConsent = await PrivacyConsentService.hasActiveConsent({
    userId,
    purpose: "SECONDARY_USE",
  });

  return hasMarketingConsent && hasSecondaryUseConsent;
}

/**
 * Utility to wrap email sending logic with compliance checks.
 */
export async function sendMarketingEmailGate(args: {
  userId: string;
  emailSendFn: () => Promise<any>;
}) {
  const allowed = await canSendMarketing(args.userId);
  if (!allowed) {
    throw new Error("COMMUNICATION_BLOCKED: Marketing consent required.");
  }
  return args.emailSendFn();
}
