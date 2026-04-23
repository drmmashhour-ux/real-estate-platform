import { prisma } from "@/lib/db";

import type { LecipmAutopilotDomainId } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";

export type PerDomainAutopilotStats = {
  domain: LecipmAutopilotDomainId;
  total: number;
  allow: number;
  requireApproval: number;
  block: number;
  rollback: number;
};

export async function getAutopilotDomainMetrics(
  since: Date,
  domains: LecipmAutopilotDomainId[]
): Promise<PerDomainAutopilotStats[]> {
  const out: PerDomainAutopilotStats[] = [];
  for (const domain of domains) {
    const rows = await prisma.lecipmFullAutopilotExecution.findMany({
      where: { domain, createdAt: { gte: since } },
    });
    out.push({
      domain,
      total: rows.length,
      allow: rows.filter((r) => r.decisionOutcome === "ALLOW_AUTOMATIC").length,
      requireApproval: rows.filter((r) => r.decisionOutcome === "REQUIRE_APPROVAL").length,
      block: rows.filter((r) => r.decisionOutcome === "BLOCK").length,
      rollback: rows.filter((r) => r.rolledBackAt).length,
    });
  }
  return out;
}
