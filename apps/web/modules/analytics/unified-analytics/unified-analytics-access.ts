import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canAccessInvestorDashboard } from "@/lib/investor/access";
import type { UnifiedAnalyticsView } from "./unified-analytics.types";

export type AnalyticsAccess = {
  allowed: boolean;
  view: UnifiedAnalyticsView;
  reason?: string;
};

/**
 * Founders/admins → full. Investors/accountants → investor summary. Brokers → operator scope.
 */
export async function resolveUnifiedAnalyticsAccess(userId: string): Promise<AnalyticsAccess> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!u) return { allowed: false, view: "investor", reason: "User not found" };

  switch (u.role) {
    case "ADMIN":
      return { allowed: true, view: "full" };
    case "ACCOUNTANT":
    case "INVESTOR":
      if (await canAccessInvestorDashboard(userId)) {
        return { allowed: true, view: "investor" };
      }
      return { allowed: false, view: "investor", reason: "Investor dashboard access required" };
    case "BROKER":
    case "HOST":
    case "LISTING_OPERATOR":
    case "OUTREACH_OPERATOR":
      return { allowed: true, view: "operator" };
    default:
      return {
        allowed: false,
        view: "investor",
        reason: "Analytics restricted to founders, investors, brokers, hosts, and operators",
      };
  }
}
