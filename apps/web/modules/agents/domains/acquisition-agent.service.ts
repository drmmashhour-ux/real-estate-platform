import { prisma } from "@/lib/db";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

export async function runAcquisitionAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentAcquisition("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  let pd =
    ctx.entityType === "PIPELINE_DEAL" ?
      await prisma.investmentPipelineDeal.findUnique({
        where: { id: ctx.entityId },
        select: {
          title: true,
          pipelineStage: true,
          conditions: { where: { status: "OPEN" }, select: { id: true } },
          diligenceTasks: { where: { status: "OPEN" }, select: { id: true } },
        },
      })
    : null;

  if (!pd && ctx.entityType === "DEAL") {
    const deal = await prisma.deal.findUnique({
      where: { id: ctx.entityId },
      select: { listingId: true },
    });
    if (deal?.listingId) {
      pd = await prisma.investmentPipelineDeal.findFirst({
        where: { listingId: deal.listingId },
        orderBy: { updatedAt: "desc" },
        select: {
          title: true,
          pipelineStage: true,
          conditions: { where: { status: "OPEN" }, select: { id: true } },
          diligenceTasks: { where: { status: "OPEN" }, select: { id: true } },
        },
      });
    }
  }

  const openConditions = pd?.conditions.length ?? 0;
  const openDiligence = pd?.diligenceTasks.length ?? 0;
  const stage = pd?.pipelineStage ?? "UNKNOWN";

  let guidance: "PROCEED" | "HOLD" | "DECLINE" = "PROCEED";
  if (openConditions > 3 || openDiligence > 5) guidance = "HOLD";
  if (stage === "CLOSED" || stage === "REJECTED") guidance = "DECLINE";

  const headline =
    pd ?
      `Pipeline ${stage} — ${openConditions} open condition(s), ${openDiligence} diligence item(s).`
    : "No investment pipeline deal context — acquisition signals unavailable for this entity.";

  return {
    agentName: "ACQUISITION",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: pd ? "MEDIUM" : "LOW",
    headline,
    recommendations:
      guidance === "PROCEED" ?
        ["Advance diligence only after material gaps are documented (policy-bound)."]
      : ["Resolve open conditions before scaling acquisition spend."],
    blockers: openConditions > 0 ? [`${openConditions} open pipeline condition(s).`] : [],
    risks: [],
    opportunities: guidance === "PROCEED" ? ["Screen next milestone against committee policy."] : [],
    requiresEscalation: guidance !== "PROCEED",
    metadata: { guidance, pipelineStage: stage, schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
  };
}
