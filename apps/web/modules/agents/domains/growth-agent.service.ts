import { prisma } from "@/lib/db";
import type { AgentContext, AgentOutput } from "../executive.types";
import { EXECUTIVE_AGENT_SCHEMA_VERSION } from "../executive-versions";
import { executiveLog } from "../executive-log";

/** Broker enablement / listing attractiveness — lightweight signals only (no duplicate growth engines). */
export async function runGrowthAgent(ctx: AgentContext): Promise<AgentOutput> {
  executiveLog.agentGrowth("start", { entityType: ctx.entityType, entityId: ctx.entityId });

  let listingId: string | null = null;
  if (ctx.entityType === "LISTING") listingId = ctx.entityId;
  if (ctx.entityType === "PIPELINE_DEAL") {
    const pd = await prisma.investmentPipelineDeal.findUnique({
      where: { id: ctx.entityId },
      select: { listingId: true },
    });
    listingId = pd?.listingId ?? null;
  }

  if (!listingId) {
    return {
      agentName: "GROWTH",
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      confidenceLevel: "LOW",
      headline: "Growth agent needs a listing context (LISTING or PIPELINE_DEAL with listing).",
      recommendations: ["Attach listing for conversion and positioning signals."],
      blockers: [],
      risks: [],
      opportunities: [],
      requiresEscalation: false,
      metadata: { schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
    };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { title: true, crmMarketplaceLive: true },
  });

  return {
    agentName: "GROWTH",
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    confidenceLevel: "LOW",
    headline: listing ? `Listing ${listing.crmMarketplaceLive ? "visible" : "not on marketplace"} — ${listing.title.slice(0, 80)}` : "Listing missing.",
    recommendations: [
      "Improve photo set + structured attributes before paid acquisition pushes (general best practice).",
    ],
    blockers: [],
    risks: ["Market positioning must not outrank compliance disclosure readiness."],
    opportunities: ["A/B test headline after compliance baseline is green."],
    requiresEscalation: false,
    metadata: { listingId, schemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION },
  };
}
