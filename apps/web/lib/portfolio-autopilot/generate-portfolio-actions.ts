import type { PortfolioAutopilotActionPriority } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ACTION_CONTENT_TOP,
  ACTION_OPTIMIZE_WEAK,
  ACTION_PRICING_REVIEW,
  ACTION_PROMOTE_CONVERTERS,
  ACTION_RESPONSE_TIME,
  ACTION_OPPORTUNITY_LISTING,
} from "./validators";
import type { PortfolioOpportunity } from "./get-opportunities";
import type { PortfolioListingSignals } from "./types";

export type GeneratedPortfolioAction = {
  actionType: string;
  title: string;
  description: string;
  priority: PortfolioAutopilotActionPriority;
  metadataJson: Record<string, unknown>;
};

export async function generatePortfolioActions(input: {
  ownerUserId: string;
  weak: PortfolioListingSignals[];
  top: PortfolioListingSignals[];
  opportunities: PortfolioOpportunity[];
}): Promise<GeneratedPortfolioAction[]> {
  const actions: GeneratedPortfolioAction[] = [];

  const weakIds = input.weak.slice(0, 3).map((l) => l.id);
  if (weakIds.length > 0) {
    actions.push({
      actionType: ACTION_OPTIMIZE_WEAK,
      title: `Optimize ${weakIds.length} weaker listing(s)`,
      description:
        "Run listing optimization (copy, photos, CTA) on stays that drag portfolio quality or conversion.",
      priority: "high",
      metadataJson: { listingIds: weakIds, source: "weak_performers" },
    });
  }

  const topIds = input.top.slice(0, 2).map((l) => l.id);
  if (topIds.length > 0) {
    actions.push({
      actionType: ACTION_CONTENT_TOP,
      title: `Refresh content on ${topIds.length} top performer(s)`,
      description:
        "Double down on listings that already convert — tighten titles, hero photos, and highlights to capture more demand.",
      priority: "medium",
      metadataJson: { listingIds: topIds, source: "top_performers" },
    });
  }

  const pricingCandidates = input.weak
    .filter((l) => l.pricingScore < 58)
    .slice(0, 4)
    .map((l) => l.id);
  if (pricingCandidates.length > 0) {
    actions.push({
      actionType: ACTION_PRICING_REVIEW,
      title: `Review pricing on ${pricingCandidates.length} listing(s)`,
      description:
        "Pricing competitiveness looks soft — compare to peers and queue pricing suggestions for approval (never auto-applied).",
      priority: "high",
      metadataJson: { listingIds: pricingCandidates, source: "pricing_score" },
    });
  }

  const hostPerf = await prisma.hostPerformance.findUnique({
    where: { hostId: input.ownerUserId },
  });
  if (hostPerf && (hostPerf.cancellationRate > 0.12 || hostPerf.responseRate < 0.72)) {
    actions.push({
      actionType: ACTION_RESPONSE_TIME,
      title: "Improve host response and reliability",
      description:
        "Response rate or cancellations are stressing portfolio behavior scores — prioritize inbox SLAs and calendar accuracy.",
      priority: "high",
      metadataJson: {
        responseRate: hostPerf.responseRate,
        cancellationRate: hostPerf.cancellationRate,
      },
    });
  }

  const promoteIds = input.top
    .filter((l) => l.conversionRate != null && l.conversionRate >= 0.02)
    .slice(0, 2)
    .map((l) => l.id);
  if (promoteIds.length > 0) {
    actions.push({
      actionType: ACTION_PROMOTE_CONVERTERS,
      title: "Promote strong converters",
      description:
        "High-converting stays can absorb more visibility — consider BNHub promotions or featured placement where available.",
      priority: "low",
      metadataJson: { listingIds: promoteIds, source: "conversion" },
    });
  }

  if (input.opportunities.length > 0) {
    const focus = input.opportunities[0];
    actions.push({
      actionType: ACTION_OPPORTUNITY_LISTING,
      title: `Opportunity: ${focus.listing.title.slice(0, 48)}${focus.listing.title.length > 48 ? "…" : ""}`,
      description: focus.note,
      priority: "medium",
      metadataJson: {
        listingId: focus.listing.id,
        kind: focus.kind,
      },
    });
  }

  return actions;
}
