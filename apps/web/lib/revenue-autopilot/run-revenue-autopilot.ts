import { prisma } from "@/lib/db";
import { applySafeRevenueActions } from "./apply-safe-revenue-actions";
import { computeRevenueHealth, upsertRevenueHealthRecord } from "./compute-revenue-health";
import { generateRevenueActions } from "./generate-revenue-actions";
import { getOrCreateRevenueAutopilotSettings } from "./get-revenue-settings";
import { getRevenueLeaks } from "./get-revenue-leaks";
import { getRevenueOpportunities } from "./get-revenue-opportunities";
import { getTopEarners } from "./get-top-earners";
import { getWeakMonetizers } from "./get-weak-monetizers";
import { logRevenueAutopilotEvent } from "./log-revenue-event";
import { revenueSafeAutoEnabled } from "./validators";

export async function runRevenueAutopilot(input: {
  scopeType: "owner" | "platform";
  scopeId: string;
  performedByUserId: string | null;
}) {
  const settings = await getOrCreateRevenueAutopilotSettings(input.scopeType, input.scopeId);
  if (settings.mode === "off") {
    throw new Error("Revenue autopilot is off for this scope");
  }

  const health = await computeRevenueHealth({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
  });

  await upsertRevenueHealthRecord({
    scopeType: health.scopeType,
    scopeId: health.scopeId,
    revenueScore: health.revenueScore,
    trendScore: health.trendScore,
    conversionScore: health.conversionScore,
    pricingEfficiencyScore: health.pricingEfficiencyScore,
    portfolioMixScore: health.portfolioMixScore,
    summary: health.summary,
  });

  const topEarners = getTopEarners(health.listings);
  const weakMonetizers = getWeakMonetizers(health.listings);
  const leaks = getRevenueLeaks(health.listings);
  const opportunities = getRevenueOpportunities(health.listings);

  const oppRows = opportunities.slice(0, 20).map((o) => ({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    listingId: o.listing.listingId,
    opportunityType: o.opportunityType,
    currentRevenueCents: o.listing.revenue90dCents,
    estimatedRevenueCents: o.estimatedUpliftCents,
    notes: o.notes,
  }));
  if (oppRows.length > 0) {
    await prisma.revenueOpportunityLog.createMany({ data: oppRows });
  }

  await prisma.revenueAutopilotAction.deleteMany({
    where: {
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      status: "suggested",
    },
  });

  const generated = await generateRevenueActions({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    topEarners,
    leaks,
    opportunities,
    weakMonetizers,
  });

  if (generated.length > 0) {
    await prisma.revenueAutopilotAction.createMany({
      data: generated.map((g) => ({
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        listingId: g.listingId ?? undefined,
        actionType: g.actionType,
        title: g.title,
        description: g.description,
        estimatedUpliftCents: g.estimatedUpliftCents ?? undefined,
        priority: g.priority,
        metadataJson: g.metadataJson as object,
      })),
    });
  }

  await logRevenueAutopilotEvent({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    actionType: "run_completed",
    performedByUserId: input.performedByUserId,
    hostId: input.scopeType === "owner" ? input.scopeId : null,
    outputPayload: {
      revenueScore: health.revenueScore,
      actionsCreated: generated.length,
    },
    explanation: health.summary,
  });

  if (revenueSafeAutoEnabled(settings.mode)) {
    await applySafeRevenueActions({
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      performedByUserId: input.performedByUserId,
    });
  }

  return {
    revenueScore: health.revenueScore,
    summary: health.summary,
    totalRevenueCents90: health.totalRevenueCents90,
    totalRevenueCentsPrev90: health.totalRevenueCentsPrev90,
    topEarners,
    weakMonetizers,
    leaks,
    opportunities,
    actionsCreated: generated.length,
  };
}
