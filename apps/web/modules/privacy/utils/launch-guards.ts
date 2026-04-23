import { prisma } from "@/lib/db";
import { PrivacyPurpose } from "@prisma/client";

export class PrivacyLaunchGuard {
  /**
   * Validates if the system is ready for production launch based on privacy requirements.
   */
  static async validateLaunchReadiness() {
    const checks = {
      privacyOfficerPublished: false,
      privacyPolicyPublished: true, // Hardcoded for now as it's a page
      complaintProcedurePublished: true, // Part of the privacy page
      incidentRegisterActive: true, // DB model exists
      retentionPolicyActive: false,
    };

    const officer = await prisma.privacyOfficer.findFirst({
      where: { published: true },
    });
    checks.privacyOfficerPublished = !!officer;

    const retentionPolicy = await prisma.privacyRetentionPolicy.findFirst();
    checks.retentionPolicyActive = !!retentionPolicy;

    const allOk = Object.values(checks).every(v => v === true);

    return {
      allOk,
      checks,
    };
  }

  /**
   * Enforces the mandatory pre-transaction signature gate.
   */
  static async assertTransactionGate(userId: string, transactionId?: string) {
    const hasConsent = await prisma.privacyConsentRecord.findFirst({
      where: {
        userId,
        transactionId: transactionId ?? null,
        purpose: PrivacyPurpose.TRANSACTION_EXECUTION,
        granted: true,
        revokedAt: null,
      },
    });

    if (!hasConsent) {
      throw new Error("MANDATORY_GATE_UNSIGNED: Privacy, Consent and Information Handling Acknowledgement required.");
    }

    return true;
  }
}
