import { prisma } from "@/lib/db";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

export async function runAssetOperationsAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentAssetOps("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  if (ctx.entityType !== "ASSET") {
    return {
      agentName: "ASSET_OPERATIONS",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "Asset operations agent requires ASSET entity.",
      recommendations: [],
      blockers: [],
      risks: [],
      opportunities: [],
      requiresEscalation: false,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const asset = await prisma.postCloseAsset.findUnique({
    where: { id: ctx.entityId },
    select: {
      assetName: true,
      operationsInitialized: true,
      revenueInitialized: true,
      onboardingMetadataJson: true,
      status: true,
    },
  });

  if (!asset) {
    return {
      agentName: "ASSET_OPERATIONS",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "Asset not found.",
      recommendations: [],
      blockers: [],
      risks: [],
      opportunities: [],
      requiresEscalation: false,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const backlog: string[] = [];
  if (!asset.operationsInitialized) backlog.push("Operations onboarding incomplete.");
  if (!asset.revenueInitialized) backlog.push("Revenue initialization incomplete.");

  return {
    agentName: "ASSET_OPERATIONS",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: backlog.length ? "MEDIUM" : "HIGH",
    headline: `${asset.assetName} — ops ${asset.operationsInitialized ? "initialized" : "pending"}, revenue ${asset.revenueInitialized ? "initialized" : "pending"}.`,
    recommendations: backlog.length ?
      backlog.map((b) => `Schedule: ${b}`)
    : ["Maintain operating cadence — monitor backlog weekly."],
    blockers: backlog,
    risks: backlog.length ? ["Operational drift risk until onboarding completes."] : [],
    opportunities: [],
    requiresEscalation: backlog.length > 1,
    metadata: { status: asset.status, schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
  };
}
