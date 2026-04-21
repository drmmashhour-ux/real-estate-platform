import { evaluateFinalClosingReadiness } from "@/modules/closing/closing-orchestrator";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

export async function runClosingAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentClosing("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  if (ctx.entityType !== "DEAL") {
    return {
      agentName: "CLOSING",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "Closing agent applies to transactional Deal entities only.",
      recommendations: [],
      blockers: [],
      risks: [],
      opportunities: [],
      requiresEscalation: false,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const r = await evaluateFinalClosingReadiness(ctx.entityId);

  return {
    agentName: "CLOSING",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: r.readinessStatus === "READY" ? "HIGH" : "MEDIUM",
    headline: `Closing readiness: ${r.readinessStatus} — ${r.blockers.length} blocker line(s).`,
    recommendations: r.nextSteps.slice(0, 6),
    blockers: r.blockers.slice(0, 12),
    risks: r.readinessStatus === "NOT_READY" ? ["Closing not executable until readiness clears."] : [],
    opportunities: r.readinessStatus === "READY" ? ["Eligible for human-confirmed closing (existing closing room)."] : [],
    requiresEscalation: r.blockers.some((b) => b.toLowerCase().includes("reject") || b.includes("DECLINED")),
    metadata: { readinessStatus: r.readinessStatus, schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
  };
}
