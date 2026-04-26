import { subDays } from "date-fns";
import type { PlatformRole } from "@prisma/client";

import type { SimulationBaseline } from "./simulation.types";
import { isExecutiveCommandCenter } from "@/modules/command-center/command-center.types";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * Read-only snapshot for sandbox — no writes.
 */
export async function loadSimulationBaseline(
  userId: string,
  role: PlatformRole,
  regionKey: string | null,
): Promise<SimulationBaseline> {
  const since = subDays(new Date(), 30);
  const dealWhere = isExecutiveCommandCenter(role) ? {} : { brokerId: userId };

  const [activeDeals, pipeline, leads30d, trustSnap, disputePred, openDisputes, closedRecent] = await Promise.all([
    prisma.deal.count({
      where: { ...dealWhere, NOT: { status: { in: ["cancelled", "closed"] } } },
    }),
    prisma.deal.aggregate({
      where: { ...dealWhere, NOT: { status: { in: ["cancelled", "closed"] } } },
      _sum: { priceCents: true },
    }),
    prisma.lecipmCrmPipelineLead.count({
      where: { brokerId: userId, createdAt: { gte: since } },
    }),
    prisma.lecipmOperationalTrustSnapshot.findFirst({
      where: { targetType: "BROKER", targetId: userId },
      orderBy: { createdAt: "desc" },
    }),
    isExecutiveCommandCenter(role) ?
      prisma.lecipmDisputePredictionSnapshot.findFirst({ orderBy: { createdAt: "desc" } })
    : Promise.resolve(null),
    prisma.lecipmDisputeCase.count({
      where: { status: { in: ["OPEN", "IN_REVIEW", "ESCALATED"] } },
    }),
    prisma.deal.count({
      where: { ...dealWhere, status: "closed", updatedAt: { gte: since } },
    }),
  ]);

  const pipelineCents = pipeline._sum.priceCents ?? 0;
  const conversionPct =
    leads30d > 0 ? Math.min(100, Math.round((closedRecent / Math.max(leads30d, 1)) * 100)) : 0;

  let cityLabel: string | null = null;
  if (regionKey) {
    const city = await prisma.city.findFirst({
      where: { id: regionKey },
      select: { name: true, slug: true },
    });
    cityLabel = city?.name ?? regionKey;
  } else {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { lecipmCity: { select: { name: true } } },
    });
    cityLabel = u?.lecipmCity?.name ?? null;
  }

  // Workload: deals + open disputes + leads (heuristic "units", not hours)
  const workloadUnits = activeDeals * 1.1 + openDisputes * 2 + Math.min(40, leads30d) * 0.15;

  return {
    generatedAt: new Date().toISOString(),
    activeDeals,
    pipelineValueCents: pipelineCents,
    leads30d,
    conversionPct,
    trustScore: trustSnap?.trustScore ?? null,
    disputeRisk0to100: disputePred?.disputeRiskScore != null ? Number(disputePred.disputeRiskScore) : null,
    openDisputes,
    workloadUnits: Math.round(workloadUnits * 10) / 10,
    regionLabel: cityLabel,
  };
}
