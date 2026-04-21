import { buildPortfolioIntelligence } from "@/modules/portfolio/portfolio-intelligence.service";
import { computePortfolioHealth } from "@/modules/portfolio/portfolio-health.engine";
import { loadPortfolioAssetContext } from "@/modules/portfolio/portfolio-access";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

/** Delegates to portfolio intelligence module — no duplicated scoring. */
export async function runPortfolioAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentPortfolio("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  if (ctx.entityType === "ASSET") {
    const loaded = await loadPortfolioAssetContext(ctx.entityId);
    if (!loaded) {
      return {
        agentName: "PORTFOLIO",
        entityType: ctx.entityType,
        entityId: ctx.entityId,
        confidenceLevel: "LOW",
        headline: "Asset not found for portfolio intelligence context.",
        recommendations: [],
        blockers: [],
        risks: [],
        opportunities: [],
        requiresEscalation: false,
        metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
      };
    }
    const health = computePortfolioHealth(loaded);
    const critical = health.healthBand === "CRITICAL" || health.healthBand === "AT_RISK";

    return {
      agentName: "PORTFOLIO",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: critical ? "LOW" : "MEDIUM",
      headline: `Asset ${loaded.assetName}: overall ${health.overallHealthScore.toFixed(1)} (${health.healthBand}).`,
      recommendations: health.opportunities.slice(0, 6),
      blockers: health.blockers.slice(0, 12),
      risks:
        critical ?
          ["Portfolio risk concentration — prioritize stabilization before discretionary actions."]
        : [],
      opportunities: health.opportunities.slice(0, 8),
      requiresEscalation: critical,
      metadata: {
        healthBand: health.healthBand,
        schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION,
      },
    };
  }

  if (ctx.entityType !== "PORTFOLIO") {
    return {
      agentName: "PORTFOLIO",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "Portfolio agent needs entityType PORTFOLIO (cross-portfolio) or ASSET (single-asset view).",
      recommendations: [],
      blockers: [],
      risks: [],
      opportunities: [],
      requiresEscalation: false,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const bundle = await buildPortfolioIntelligence(ctx.userId, ctx.role);

  const top = bundle.priorities.slice(0, 5).map((p) => `#${p.rank} ${p.title}`);
  const critical = bundle.overview.criticalCount > 0;

  return {
    agentName: "PORTFOLIO",
    entityType: "PORTFOLIO",
    entityId: ctx.entityId,
    confidenceLevel: "MEDIUM",
    headline: `${bundle.overview.totalAssets} asset(s) · avg band ${bundle.overview.averageHealthBand} · ${bundle.overview.criticalCount} critical.`,
    recommendations: top,
    blockers: bundle.watchlist.slice(0, 5).map((w) => `${w.assetName ?? w.assetId}: ${w.reason}`),
    risks: critical ? ["Critical-band assets present — prioritize urgent fixes before discretionary spend."] : [],
    opportunities: bundle.commonThemes.slice(0, 5),
    requiresEscalation: critical,
    metadata: {
      policyMode: bundle.overview.policyMode,
      schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION,
    },
  };
}
