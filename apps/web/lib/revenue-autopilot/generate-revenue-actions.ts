import type { RevenueAutopilotActionPriority } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ACTION_BROKER_FOLLOWUP,
  ACTION_GENERATE_CONTENT,
  ACTION_IMPROVE_CONVERSION,
  ACTION_PROMOTE_LISTING,
  ACTION_RECOVER_ABANDONED,
  ACTION_SUGGEST_PRICE_REVIEW,
  ACTION_TRIGGER_LISTING_OPT,
  ACTION_TRIGGER_PORTFOLIO,
  ACTION_UPSELL_FEATURED,
} from "./validators";
import type { RevenueLeak } from "./get-revenue-leaks";
import type { RevenueOpportunity } from "./get-revenue-opportunities";
import type { RevenueListingContext } from "./types";

export type GeneratedRevenueAction = {
  actionType: string;
  title: string;
  description: string;
  priority: RevenueAutopilotActionPriority;
  listingId?: string | null;
  estimatedUpliftCents?: number | null;
  metadataJson: Record<string, unknown>;
};

export async function generateRevenueActions(input: {
  scopeType: "owner" | "platform";
  scopeId: string;
  topEarners: RevenueListingContext[];
  leaks: RevenueLeak[];
  opportunities: RevenueOpportunity[];
  weakMonetizers: RevenueListingContext[];
}): Promise<GeneratedRevenueAction[]> {
  const actions: GeneratedRevenueAction[] = [];

  for (const t of input.topEarners.slice(0, 3)) {
    actions.push({
      actionType: ACTION_PROMOTE_LISTING,
      title: `Promote top earner: ${t.title.slice(0, 42)}${t.title.length > 42 ? "…" : ""}`,
      description:
        "Strong revenue velocity — increase internal visibility (search ranking inputs, collections) and consider BNHub merchandising where available.",
      priority: "high",
      listingId: t.listingId,
      estimatedUpliftCents: Math.round(t.revenue90dCents * 0.06),
      metadataJson: { listingCode: t.listingCode, city: t.city },
    });
    actions.push({
      actionType: ACTION_GENERATE_CONTENT,
      title: `Refresh hero content for ${t.listingCode}`,
      description: "Top earners benefit from crisp seasonal copy and hero photo tests to compound demand.",
      priority: "medium",
      listingId: t.listingId,
      estimatedUpliftCents: Math.round(t.revenue90dCents * 0.04),
      metadataJson: { source: "top_earner" },
    });
  }

  for (const leak of input.leaks.slice(0, 4)) {
    actions.push({
      actionType: ACTION_TRIGGER_LISTING_OPT,
      title: `Fix monetization leak: ${leak.listing.title.slice(0, 40)}…`,
      description: leak.reason,
      priority: "high",
      listingId: leak.listing.listingId,
      estimatedUpliftCents: Math.round(Math.max(5000, leak.listing.nightPriceCents * 3)),
      metadataJson: { source: "revenue_leak" },
    });
  }

  for (const w of input.weakMonetizers.slice(0, 3)) {
    actions.push({
      actionType: ACTION_IMPROVE_CONVERSION,
      title: `Improve conversion for ${w.listingCode}`,
      description:
        "Low revenue per view — run listing optimization, strengthen trust badges, and review instant book / pricing bands.",
      priority: "high",
      listingId: w.listingId,
      estimatedUpliftCents: Math.round(w.nightPriceCents * 4),
      metadataJson: { source: "weak_monetizer" },
    });
  }

  for (const o of input.opportunities.slice(0, 5)) {
    if (o.opportunityType === "pricing_efficiency") {
      actions.push({
        actionType: ACTION_SUGGEST_PRICE_REVIEW,
        title: `Price review: ${o.listing.title.slice(0, 40)}…`,
        description: o.notes,
        priority: "high",
        listingId: o.listing.listingId,
        estimatedUpliftCents: o.estimatedUpliftCents,
        metadataJson: { opportunityType: o.opportunityType },
      });
    }
  }

  actions.push({
    actionType: ACTION_UPSELL_FEATURED,
    title: "Consider featured placement for a high-converting stay",
    description:
      "When conversion is healthy, paid or internal featured slots can scale revenue — review eligibility and budget outside autopilot.",
    priority: "low",
    estimatedUpliftCents: null,
    metadataJson: { guidance: true },
  });

  if (input.scopeType === "owner") {
    const ownerListingIds = await prisma.shortTermListing.findMany({
      where: { ownerId: input.scopeId },
      select: { id: true },
    });
    const idList = ownerListingIds.map((x) => x.id);
    const abandoned =
      idList.length === 0
        ? []
        : await prisma.listingAnalytics.findMany({
            where: {
              kind: "BNHUB",
              listingId: { in: idList },
              unlockCheckoutStarts: { gt: 2 },
            },
            select: {
              listingId: true,
              unlockCheckoutStarts: true,
              unlockCheckoutSuccesses: true,
            },
            take: 20,
          });
    let lostCents = 0;
    for (const a of abandoned) {
      const gap = Math.max(0, a.unlockCheckoutStarts - a.unlockCheckoutSuccesses);
      lostCents += gap * 8000;
    }
    if (lostCents > 15_000) {
      actions.push({
        actionType: ACTION_RECOVER_ABANDONED,
        title: "Recover abandoned checkout revenue",
        description:
          "Guests started checkout but did not finish — tighten payment messaging, fee transparency, and mobile UX. No automatic fee changes.",
        priority: "medium",
        estimatedUpliftCents: lostCents,
        metadataJson: { abandonedRows: abandoned.length },
      });
    }

    const brokerLeads = await prisma.lead.count({
      where: {
        OR: [{ introducedByBrokerId: input.scopeId }, { lastFollowUpByBrokerId: input.scopeId }],
        pipelineStage: { notIn: ["won", "lost"] },
      },
    });
    if (brokerLeads >= 3) {
      actions.push({
        actionType: ACTION_BROKER_FOLLOWUP,
        title: "Prioritize broker pipeline follow-ups",
        description: `${brokerLeads} open CRM leads may need follow-up to convert monetization.`,
        priority: "medium",
        estimatedUpliftCents: brokerLeads * 25_000,
        metadataJson: { openLeads: brokerLeads },
      });
    }

    actions.push({
      actionType: ACTION_TRIGGER_PORTFOLIO,
      title: "Align with portfolio autopilot",
      description: "Refresh portfolio-level health and weak-listing passes to stack with revenue actions.",
      priority: "low",
      estimatedUpliftCents: null,
      metadataJson: { integrate: "portfolio_autopilot" },
    });
  }

  return actions;
}
