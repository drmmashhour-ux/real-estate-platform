import { prisma } from "@/lib/db";

/**
 * PHASE 1 & 8: AMF SAFE MODE SERVICE
 * Manages the global investment policy and monitors for scale triggers.
 */
export class AmfSafeModeService {
  private static POLICY_ID = "amf_policy_global";

  /**
   * Returns the global AMF policy.
   * Auto-creates if missing.
   */
  static async getPolicy() {
    let policy = await prisma.amfPolicy.findUnique({
      where: { id: this.POLICY_ID },
    });

    if (!policy) {
      policy = await prisma.amfPolicy.create({
        data: {
          id: this.POLICY_ID,
          fundMode: "PRIVATE",
          maxInvestorsPerDeal: 50, // Rule of thumb for private exemptions
          requireIndependentSpv: true,
          blockPublicMarketing: true,
          disableAutoAllocation: true,
        },
      });
    }

    return policy;
  }

  /**
   * PHASE 8: SCALE TRIGGER
   * Checks if a deal or the platform has reached limits that require AMF registration.
   */
  static async checkScaleTriggers(dealId: string) {
    const policy = await this.getPolicy();
    const deal = await prisma.amfCapitalDeal.findUnique({
      where: { id: dealId },
    });

    if (!deal) throw new Error("Deal not found.");

    const triggers: string[] = [];

    if (deal.investorCount >= policy.maxInvestorsPerDeal) {
      triggers.push("investor count limit reached");
    }

    if (deal.allowsPublicMarketing) {
      triggers.push("public marketing detected");
    }

    // Heuristic: If total capital raised across deal exceeds a certain threshold (e.g. 5M)
    if (deal.totalCapitalRaised > 5000000) {
      triggers.push("capital threshold reached (> 5M)");
    }

    if (triggers.length > 0) {
      return {
        compliant: false,
        warning: "AMF registration required",
        reasons: triggers,
      };
    }

    return { compliant: true };
  }
}
