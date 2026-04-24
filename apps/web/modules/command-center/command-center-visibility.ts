import type { PlatformRole } from "@prisma/client";

/** Sections hidden for broker-focused command center (ADMIN sees all). */
export type CommandCenterSectionKey =
  | "executiveSummary"
  | "revenueGrowth"
  | "dealsPipeline"
  | "leadsConversion"
  | "trustRisk"
  | "marketingExpansion"
  | "approvalsAlerts"
  | "quickActions"
  | "liveFeed";

const BROKER_HIDDEN: CommandCenterSectionKey[] = ["marketingExpansion"];

/** Pure visibility rules — unit-tested. */
export function visibleSectionsForRole(role: PlatformRole): Record<CommandCenterSectionKey, boolean> {
  const exec = role === "ADMIN";
  const base: Record<CommandCenterSectionKey, boolean> = {
    executiveSummary: true,
    revenueGrowth: true,
    dealsPipeline: true,
    leadsConversion: true,
    trustRisk: true,
    marketingExpansion: exec,
    approvalsAlerts: true,
    quickActions: true,
    liveFeed: true,
  };
  if (!exec) {
    for (const k of BROKER_HIDDEN) {
      base[k] = false;
    }
  }
  return base;
}
