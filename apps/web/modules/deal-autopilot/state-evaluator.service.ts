import type { Deal } from "@prisma/client";

export function evaluateCurrentStage(deal: Deal): string {
  const s = deal.status?.toLowerCase() ?? "unknown";
  const crm = deal.crmStage?.toLowerCase();
  if (crm) return `${s} · CRM: ${crm}`;
  return s;
}

export function evaluateDealHealth(input: {
  blockerCount: number;
  overdueCount: number;
  openComplianceCount: number;
}): import("./deal-autopilot.types").DealHealthLevel {
  if (input.blockerCount >= 3 || input.openComplianceCount >= 2) return "blocked";
  if (input.blockerCount >= 1 || input.overdueCount >= 1 || input.openComplianceCount >= 1) return "at_risk";
  return "healthy";
}
