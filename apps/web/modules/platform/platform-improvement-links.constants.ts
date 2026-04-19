/**
 * Stable internal/admin targets — execution bridge primary routes + supplementary links (advisory UX only).
 */

import type { PlatformImprovementPriorityCategory } from "./platform-improvement.types";

/** Primary route for deterministic “Go fix →” by category (matches live admin URLs). */
export function primaryGoFixHref(category: PlatformImprovementPriorityCategory): string {
  switch (category) {
    case "revenue":
      return PLATFORM_EXECUTION_PRIMARY.revenueGrowth;
    case "conversion":
      return PLATFORM_EXECUTION_PRIMARY.growthConsole;
    case "trust":
      return PLATFORM_EXECUTION_PRIMARY.bnhubAdmin;
    case "ops":
      return PLATFORM_EXECUTION_PRIMARY.opsRoot;
    case "data":
      return PLATFORM_EXECUTION_PRIMARY.missionFallback;
    default:
      return PLATFORM_EXECUTION_PRIMARY.opsRoot;
  }
}

export function suggestedOwnerBucket(
  category: PlatformImprovementPriorityCategory,
): "growth" | "product" | "ops" | "revenue" {
  switch (category) {
    case "revenue":
      return "revenue";
    case "conversion":
      return "growth";
    case "trust":
    case "data":
      return "product";
    case "ops":
      return "ops";
    default:
      return "ops";
  }
}

const PLATFORM_EXECUTION_PRIMARY = {
  /** Growth machine console (admin); URL path uses `growth-engine`. */
  growthConsole: "/admin/growth-engine",
  bnhubAdmin: "/admin/bnhub",
  brokersAcquisition: "/admin/brokers-acquisition",
  revenueGrowth: "/admin/growth",
  opsRoot: "/admin",
  /** No `/admin/mission-control` route — dashboard is the rollup spine. */
  missionFallback: "/admin/dashboard",
} as const;

export const PLATFORM_IMPROVEMENT_ADMIN_LINKS = {
  growthMachine: PLATFORM_EXECUTION_PRIMARY.growthConsole,
  bnhubHostDashboard: "/bnhub/host/dashboard",
  bnhubAdminListings: "/admin/listings",
  brokerAcquisition: PLATFORM_EXECUTION_PRIMARY.brokersAcquisition,
  revenueLedger: "/admin/revenue",
  revenueGrowthPanel: PLATFORM_EXECUTION_PRIMARY.revenueGrowth,
  missionControlGrowth: PLATFORM_EXECUTION_PRIMARY.missionFallback,
  managementHub: "/admin/management-hub",
  trustGraph: "/admin/trustgraph",
  analyticsTools: "/admin/analytics/tools",
  contentOps: "/admin/content-ops",
  executiveControl: "/admin/executive",
} as const;
