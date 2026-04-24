import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/audit/activity-log";

export interface SuitabilityIntake {
  riskTolerance: "LOW" | "MEDIUM" | "HIGH";
  investmentHorizon: "SHORT" | "MEDIUM" | "LONG";
  knowledgeLevel: "NOVICE" | "INTERMEDIATE" | "EXPERT";
  netWorthConfirmed: boolean;
}

/**
 * PART 9: INVESTOR PROTECTION LAYER
 * Logic for investment suitability check and risk disclosure.
 */
export class SuitabilityCheckService {
  /**
   * Records a suitability intake for an investor.
   */
  static async recordIntake(userId: string, intake: SuitabilityIntake) {
    const investor = await prisma.amfInvestor.findUnique({
      where: { userId },
    });

    if (!investor) {
      throw new Error("Investor profile not found.");
    }

    const updated = await prisma.amfInvestor.update({
      where: { userId },
      data: {
        suitabilityIntakeJson: intake as any,
      },
    });

    await logActivity({
      userId,
      action: "suitability_intake_completed",
      entityType: "AmfInvestor",
      entityId: investor.id,
      metadata: { intake },
    });

    return updated;
  }

  /**
   * Checks if an investor has completed all protection requirements.
   */
  static async validateSuitability(userId: string) {
    const investor = await prisma.amfInvestor.findUnique({
      where: { userId },
      select: {
        suitabilityIntakeJson: true,
        simulationConsent: true,
        kycStatus: true,
      }
    });

    if (!investor) {
      return { allowed: false, reason: "No investor profile found." };
    }

    const intake = investor.suitabilityIntakeJson as any as SuitabilityIntake | null;

    if (!intake) {
      return { allowed: false, reason: "Suitability check not completed." };
    }

    if (!investor.simulationConsent) {
      return { allowed: false, reason: "Simulation mode consent required." };
    }

    return { allowed: true };
  }
}
