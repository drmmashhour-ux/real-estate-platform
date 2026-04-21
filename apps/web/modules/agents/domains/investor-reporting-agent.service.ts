import { prisma } from "@/lib/db";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

export async function runInvestorReportingAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentInvestorReporting("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  const pipelineId = ctx.entityType === "PIPELINE_DEAL" ? ctx.entityId : null;
  if (!pipelineId) {
    return {
      agentName: "INVESTOR_REPORTING",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "Investor reporting traceability requires PIPELINE_DEAL entity.",
      recommendations: [],
      blockers: [],
      risks: [],
      opportunities: [],
      requiresEscalation: false,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const pd = await prisma.investmentPipelineDeal.findUnique({
    where: { id: pipelineId },
    select: { latestMemoId: true, latestIcPackId: true, headlineRecommendation: true },
  });

  return {
    agentName: "INVESTOR_REPORTING",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: pd?.latestMemoId && pd?.latestIcPackId ? "MEDIUM" : "LOW",
    headline: "Investor surfaces — memo / IC pack linkage from pipeline (existing artifacts).",
    recommendations: [
      pd?.headlineRecommendation?.slice(0, 240) ?? "Align narrative with compliance-verified facts only.",
    ],
    blockers: [...(!pd?.latestMemoId ? ["Latest memo not attached."] : []), ...(!pd?.latestIcPackId ? ["Latest IC pack not attached."] : [])],
    risks: ["External-facing claims require human review — estimates are not verification."],
    opportunities: pd?.latestMemoId ? ["Refresh executive summary after material pipeline changes."] : [],
    requiresEscalation: !pd?.latestMemoId || !pd?.latestIcPackId,
    metadata: {
      memoId: pd?.latestMemoId,
      icPackId: pd?.latestIcPackId,
      schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION,
    },
  };
}
