/**
 * Investment / securities-adjacent features (valuations, agreements, portfolio tools).
 *
 * ⚠️ AMF COMPLIANCE WARNING (Québec):
 * Offering investment products, investment advice, or managing third-party capital may require
 * registration / exemptions with the Autorité des marchés financiers (AMF) and other regulators.
 * Keep these features OFF in production until legal counsel confirms your model and disclosures.
 *
 * Enforcement: server routes MUST call `assertInvestmentFeaturesEnabled()` before serving investment flows.
 */

import { prisma } from "@/lib/db";

export const INVESTMENT_AMF_COMPLIANCE_WARNING =
  "Investment-related features may require AMF / securities compliance. Do not enable for end users without legal review.";

/** Internal default: disabled unless env or DB explicitly enables. */
export async function isInvestmentFeaturesEnabled(): Promise<boolean> {
  if (process.env.INVESTMENT_FEATURES_ENABLED === "true") return true;
  try {
    const row = await prisma.platformFinancialSettings.findUnique({
      where: { id: "default" },
      select: { investmentFeaturesEnabled: true },
    });
    return row?.investmentFeaturesEnabled === true;
  } catch {
    return false;
  }
}

export async function assertInvestmentFeaturesEnabled(): Promise<void> {
  if (!(await isInvestmentFeaturesEnabled())) {
    const err = new Error("Investment features are disabled");
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }
}
