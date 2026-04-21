import { prisma } from "@/lib/db";
import { loadPortfolioAssetContext } from "@/modules/portfolio/portfolio-access";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

export async function runLegalComplianceAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentLegal("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  let dealId: string | null = null;
  let listingId: string | null = null;

  if (ctx.entityType === "ASSET") {
    const ctxAsset = await loadPortfolioAssetContext(ctx.entityId);
    if (ctxAsset) {
      dealId = ctxAsset.dealId;
      listingId = ctxAsset.listingId;
    }
  } else if (ctx.entityType === "PIPELINE_DEAL") {
    const pd = await prisma.investmentPipelineDeal.findUnique({
      where: { id: ctx.entityId },
      select: { listingId: true },
    });
    listingId = pd?.listingId ?? null;
  }

  const cases =
    dealId || listingId ?
      await prisma.complianceCase.findMany({
        where: {
          status: "open",
          OR: [...(dealId ? [{ dealId }] : []), ...(listingId ? [{ listingId }] : [])],
        },
        select: { id: true, severity: true, title: true },
        take: 50,
      })
    : [];

  const critical = cases.filter((c) => c.severity === "critical" || c.severity === "high");

  return {
    agentName: "LEGAL_COMPLIANCE",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: cases.length ? "MEDIUM" : "LOW",
    headline: `${cases.length} open compliance case(s)${critical.length ? ` — ${critical.length} high/critical.` : "."}`,
    recommendations: cases.slice(0, 5).map((c) => `Review: ${c.title ?? c.id}`),
    blockers: critical.map((c) => `Compliance (${c.severity}): ${c.title ?? c.id}`),
    risks: critical.length ? ["Legal/compliance elevated — growth positioning must not outrank disclosure readiness."] : [],
    opportunities: [],
    requiresEscalation: critical.length > 0,
    metadata: { openCount: cases.length, schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
  };
}
