import { prisma } from "@/lib/db";
import { LecipmRiskDisclosureContext } from "@prisma/client";
import { logActivity } from "@/lib/audit/activity-log";

/**
 * PHASE 3: DISCLOSURE ENGINE
 * Manages and retrieves risk disclosures for different contexts (DEAL, FUND, ESG, AI_RECOMMENDATION).
 */
export class ComplianceDisclosureService {
  /**
   * Retrieves the latest disclosure for a given context.
   */
  static async getLatestDisclosure(context: LecipmRiskDisclosureContext) {
    return await prisma.lecipmRiskDisclosure.findFirst({
      where: { context },
      orderBy: { version: "desc" },
    });
  }

  /**
   * Records a user's acceptance of a disclosure.
   */
  static async acceptDisclosure(userId: string, disclosureId: string) {
    const acceptance = await prisma.lecipmUserRiskDisclosureAcceptance.upsert({
      where: {
        userId_disclosureId: {
          userId,
          disclosureId,
        },
      },
      update: {
        acceptedAt: new Date(),
      },
      create: {
        userId,
        disclosureId,
      },
    });

    await logActivity({
      userId,
      action: "disclosure_accepted",
      entityType: "RiskDisclosure",
      entityId: disclosureId,
    });

    return acceptance;
  }

  /**
   * Checks if a user has accepted the latest disclosure for a context.
   */
  static async hasAcceptedLatest(userId: string, context: LecipmRiskDisclosureContext): Promise<boolean> {
    const latest = await this.getLatestDisclosure(context);
    if (!latest) return true; // No disclosure to accept

    const acceptance = await prisma.lecipmUserRiskDisclosureAcceptance.findUnique({
      where: {
        userId_disclosureId: {
          userId,
          disclosureId: latest.id,
        },
      },
    });

    return !!acceptance;
  }

  /**
   * Seeds initial mandatory disclosures if they don't exist.
   */
  static async seedInitialDisclosures() {
    const disclosures = [
      {
        context: LecipmRiskDisclosureContext.AI_RECOMMENDATION,
        version: "1.0",
        message: "AI recommendations are for informational purposes and do not constitute financial, investment, or legal advice. Always perform your own due diligence.",
      },
      {
        context: LecipmRiskDisclosureContext.FUND,
        version: "1.0",
        message: "Investment in real estate funds involves high risk, including loss of principal. Projected returns are simulated and not guaranteed.",
      },
      {
        context: LecipmRiskDisclosureContext.ESG,
        version: "1.0",
        message: "ESG scores are based on AI models and available data. They are not official government certifications.",
      },
      {
        context: LecipmRiskDisclosureContext.DEAL,
        version: "1.0",
        message: "All deal analysis and projections are estimates based on historical data. Market conditions can change rapidly.",
      }
    ];

    for (const d of disclosures) {
      await prisma.lecipmRiskDisclosure.upsert({
        where: { context_version: { context: d.context, version: d.version } },
        update: {},
        create: d,
      });
    }
  }
}
