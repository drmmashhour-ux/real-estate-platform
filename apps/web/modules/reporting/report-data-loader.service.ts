import { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { generateHostRevenueNarrative } from "@/modules/revenue/narrative/narrative-generator.service";

/**
 * Resolve BNHub dashboard aggregates for an investor scope.
 * - **host**: `scopeId` = BNHub host `User.id`
 * - **portfolio**: v1 treats `scopeId` as the same host account id (single-host portfolio); extend when multi-host portfolios exist.
 */
export async function loadReportData(scopeType: string, scopeId: string) {
  const hostUserId = resolveBnhubScopeToHostUserId(scopeType, scopeId);

  const [summary, narrative] = await Promise.all([
    getRevenueDashboardSummary(hostUserId),
    generateHostRevenueNarrative(hostUserId, { persist: false }),
  ]);

  return { summary, narrative };
}

/** Map investor `InvestorAccess` scope to BNHub host user id (single-host portfolio = same id for now). */
export function resolveBnhubScopeToHostUserId(scopeType: string, scopeId: string): string {
  if (!scopeId?.trim()) throw new Error("Invalid scope");

  switch (scopeType) {
    case "host":
      return scopeId;
    case "portfolio":
      return scopeId;
    default:
      throw new Error(`Unsupported scopeType: ${scopeType}`);
  }
}
