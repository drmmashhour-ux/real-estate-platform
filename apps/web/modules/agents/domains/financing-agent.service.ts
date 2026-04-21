import { prisma } from "@/lib/db";
import { loadPortfolioAssetContext } from "@/modules/portfolio/portfolio-access";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

export async function runFinancingAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentFinancing("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  let pipelineDealId: string | null =
    ctx.entityType === "PIPELINE_DEAL" ? ctx.entityId : null;

  if (ctx.entityType === "ASSET") {
    const c = await loadPortfolioAssetContext(ctx.entityId);
    pipelineDealId = c?.pipelineDealId ?? null;
  }

  if (!pipelineDealId) {
    return {
      agentName: "FINANCING",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "No linked investment-pipeline deal — lender/covenant signals unavailable.",
      recommendations: ["Attach listing / pipeline deal for financing condition tracking."],
      blockers: [],
      risks: [],
      opportunities: [],
      requiresEscalation: false,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const pd = await prisma.investmentPipelineDeal.findUnique({
    where: { id: pipelineDealId },
    include: {
      financingConditions: { where: { status: "OPEN" } },
      financingCovenants: { where: { status: "ACTIVE" } },
    },
  });

  const fc = pd?.financingConditions.length ?? 0;
  const cov = pd?.financingCovenants.length ?? 0;

  return {
    agentName: "FINANCING",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: "MEDIUM",
    headline: `${fc} open financing condition(s); ${cov} active covenant row(s).`,
    recommendations: ["Prioritize covenant reporting cadence before discretionary capex talk-tracks."],
    blockers: fc > 0 ? [`${fc} open financing condition(s).`] : [],
    risks: fc > 2 ? ["Covenant / condition backlog may block closing sequencing."] : [],
    opportunities: fc === 0 ? ["Financing pathway relatively clear — keep lender package fresh."] : [],
    requiresEscalation: fc > 3,
    metadata: { pipelineDealId, schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
  };
}
