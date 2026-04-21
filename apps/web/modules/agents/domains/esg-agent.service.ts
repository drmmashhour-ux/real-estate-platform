import { computePortfolioHealth } from "@/modules/portfolio/portfolio-health.engine";
import { loadPortfolioAssetContext } from "@/modules/portfolio/portfolio-access";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

export async function runEsgAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentEsg("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  if (ctx.entityType !== "ASSET") {
    return {
      agentName: "ESG",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "ESG agent scoped to owned assets with listing context — run on ASSET entity for full signals.",
      recommendations: ["Link pipeline deal / listing for ESG action-center signals."],
      blockers: [],
      risks: [],
      opportunities: [],
      requiresEscalation: false,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const loaded = await loadPortfolioAssetContext(ctx.entityId);
  if (!loaded) {
    return {
      agentName: "ESG",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "Asset not found.",
      recommendations: [],
      blockers: ["Missing PostCloseAsset row."],
      risks: [],
      opportunities: [],
      requiresEscalation: true,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const health = computePortfolioHealth(loaded);
  const esg = health.subscores.esg;
  const blockers = health.blockers.filter((b) => b.toLowerCase().includes("esg") || b.includes("carbon"));

  return {
    agentName: "ESG",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: health.overallHealthScore < 55 ? "LOW" : "MEDIUM",
    headline: `ESG health sub-score ${esg.score.toFixed(1)} — ${health.blockers.length} portfolio blockers total.`,
    recommendations: esg.factors.slice(0, 3).map((f) => `${f.key}: ${f.detail}`),
    blockers,
    risks: esg.score < 50 ? ["ESG materially weak — verify evidence before marketing claims."] : [],
    opportunities: health.opportunities.filter((o) => o.toLowerCase().includes("esg") || o.includes("retrofit")),
    requiresEscalation: esg.score < 45,
    metadata: {
      esgScore: esg.score,
      schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION,
    },
  };
}
