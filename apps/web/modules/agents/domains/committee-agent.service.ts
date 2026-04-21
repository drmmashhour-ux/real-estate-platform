import { prisma } from "@/lib/db";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

export async function runCommitteeAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentCommittee("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  const pipelineId = ctx.entityType === "PIPELINE_DEAL" ? ctx.entityId : null;
  if (!pipelineId) {
    return {
      agentName: "COMMITTEE",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "Committee agent requires PIPELINE_DEAL entity.",
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
    select: {
      committeeRequired: true,
      latestMemoId: true,
      latestIcPackId: true,
      committeeSubmissions: { orderBy: { createdAt: "desc" }, take: 1, select: { submissionStatus: true } },
      committeeDecisions: { orderBy: { createdAt: "desc" }, take: 1, select: { recommendation: true } },
    },
  });

  const memoReady = Boolean(pd?.latestMemoId);
  const icReady = Boolean(pd?.latestIcPackId);

  return {
    agentName: "COMMITTEE",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: memoReady && icReady ? "MEDIUM" : "LOW",
    headline: `Memo ${memoReady ? "present" : "missing"} · IC pack ${icReady ? "present" : "missing"}.`,
    recommendations: [
      ...(memoReady ? [] : ["Generate / attach investor memo before committee cadence (existing pipeline services)."]),
      ...(icReady ? [] : ["Generate IC pack via pipeline workflow when policy requires."]),
    ],
    blockers: [...(!memoReady ? ["Investor memo not linked."] : []), ...(!icReady ? ["IC pack not linked."] : [])],
    risks: [],
    opportunities: memoReady && icReady ? ["Submission packet materially ready — verify narrative vs compliance."] : [],
    requiresEscalation: pd?.committeeRequired && (!memoReady || !icReady),
    metadata: {
      committeeRequired: pd?.committeeRequired,
      schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION,
    },
  };
}
