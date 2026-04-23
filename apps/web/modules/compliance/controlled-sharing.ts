import { PrivacyConsentService } from "@/modules/compliance/consent.service";
import { redactSensitiveData } from "@/lib/server/redaction";
import { prisma } from "@/lib/db";

/**
 * Ensures data is shared only after consent checks, redaction, and audit logging.
 */
export async function controlledDataShare(args: {
  userId: string;
  targetUserId: string;
  transactionId: string;
  purpose: string;
  data: any;
}) {
  // 1. Check consent
  const hasConsent = await PrivacyConsentService.hasActiveConsent({
    userId: args.userId,
    purpose: args.purpose,
    transactionId: args.transactionId,
  });

  if (!hasConsent) {
    throw new Error(`CONSENT_REQUIRED: Explicit consent for ${args.purpose} is missing or revoked.`);
  }

  // 2. Redact sensitive data
  const safeData = redactSensitiveData(args.data);

  // 3. Log the action (Mandatory Audit Trail)
  await prisma.auditLog.create({
    data: {
      userId: args.targetUserId, // Who is receiving the data
      action: "DATA_SHARE_ACCESS",
      resource: `Transaction:${args.transactionId}`,
      purpose: args.purpose,
      metadata: {
        sharedBy: args.userId,
        fields: Object.keys(safeData),
      },
    },
  });

  return safeData;
}
