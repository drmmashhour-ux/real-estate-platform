import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

export type FlywheelMetrics = {
  growthSignalEvents7d: number;
  seoOpportunities: number;
  growthOpportunityCandidatesOpen: number;
  experimentsRunning: number;
};

/**
 * Snapshot compounding loop inputs — stored for dashboards; no side effects on traffic.
 */
export async function captureFlywheelSnapshot(): Promise<{ id: string } | null> {
  if (!growthV3Flags.flywheelEngineV1) return null;

  const since = new Date(Date.now() - 7 * 86400000);
  const [growthSignalEvents7d, seoOpportunities, growthOpportunityCandidatesOpen, experimentsRunning] =
    await Promise.all([
      prisma.growthSignalEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.seoPageOpportunity.count({ where: { status: { in: ["candidate", "approved"] } } }),
      prisma.growthOpportunityCandidate.count({ where: { status: "pending" } }),
      prisma.experiment.count({ where: { status: "running" } }),
    ]);

  const metrics: FlywheelMetrics = {
    growthSignalEvents7d,
    seoOpportunities,
    growthOpportunityCandidatesOpen,
    experimentsRunning,
  };

  const snap = await prisma.growthFlywheelSnapshot.create({
    data: {
      periodEnd: new Date(),
      metricsJson: metrics as object,
    },
  });
  return { id: snap.id };
}
