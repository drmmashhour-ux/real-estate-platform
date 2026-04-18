/**
 * KPI derivation from stored aggregates — no invented revenue.
 */
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function countLeadsByPipeline(userId: string, role: PlatformRole) {
  if (role === "BROKER") {
    const rows = await prisma.lead.groupBy({
      by: ["pipelineStatus"],
      where: { introducedByBrokerId: userId },
      _count: { _all: true },
    });
    return Object.fromEntries(rows.map((r) => [r.pipelineStatus, r._count._all]));
  }
  return {};
}
