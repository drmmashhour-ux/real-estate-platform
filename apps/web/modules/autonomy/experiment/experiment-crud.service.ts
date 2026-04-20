import { prisma } from "@/lib/db";

/** Admin-only draft experiment row (must set `running` via status API after assignments exist). */
export async function createDraftAutonomyExperiment(params: {
  name: string;
  scopeType: string;
  scopeId: string;
  domain: string;
  signalKey: string;
  actionType: string;
  trafficSplit?: number;
  startDate: Date;
  endDate?: Date | null;
}) {
  const trafficSplit =
    typeof params.trafficSplit === "number"
      ? Math.min(0.99, Math.max(0.01, params.trafficSplit))
      : 0.15;

  return prisma.autonomyExperiment.create({
    data: {
      name: params.name,
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      domain: params.domain,
      signalKey: params.signalKey,
      actionType: params.actionType,
      trafficSplit,
      status: "draft",
      startDate: params.startDate,
      endDate: params.endDate ?? null,
    },
  });
}
