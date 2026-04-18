/**
 * Deterministic marketplace growth readout — suggestions only; safe on DB errors (returns partial/empty).
 */

import { prisma } from "@/lib/db";
import type { MarketplaceFlywheelInsight, MarketplaceFlywheelInsightType } from "@/modules/marketplace/flywheel.types";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function impactOrder(i: MarketplaceFlywheelInsight["impact"]): number {
  if (i === "high") return 2;
  if (i === "medium") return 1;
  return 0;
}

/** Sort high → low impact, then type for stability. */
export function prioritizeFlywheelInsights(insights: MarketplaceFlywheelInsight[]): MarketplaceFlywheelInsight[] {
  return [...insights].sort((a, b) => {
    const d = impactOrder(b.impact) - impactOrder(a.impact);
    if (d !== 0) return d;
    return a.type.localeCompare(b.type);
  });
}

function makeId(type: MarketplaceFlywheelInsightType, key: string): string {
  return `flywheel-${type}-${key}`.replace(/[^a-z0-9-_]/gi, "-").slice(0, 120);
}

/**
 * Aggregates 30d leads, brokers, listings, and simple ratios — advisory signals only.
 */
export async function analyzeMarketplaceGrowth(): Promise<MarketplaceFlywheelInsight[]> {
  const since = new Date(Date.now() - WINDOW_MS);
  const insights: MarketplaceFlywheelInsight[] = [];

  try {
    const [
      brokerCount,
      leadCount30,
      hotLeads30,
      activeListings,
      leadsUnlocked30,
      wonLeads30,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "BROKER" } }),
      prisma.lead.count({ where: { createdAt: { gte: since } } }),
      prisma.lead.count({ where: { createdAt: { gte: since }, score: { gte: 70 } } }),
      prisma.fsboListing.count({
        where: { status: "ACTIVE", moderationStatus: "APPROVED" },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: since }, contactUnlockedAt: { not: null } },
      }),
      prisma.lead.count({
        where: {
          createdAt: { gte: since },
          OR: [{ pipelineStatus: "won" }, { pipelineStatus: "closed" }],
        },
      }),
    ]);

    const leadsPerBroker = brokerCount > 0 ? leadCount30 / brokerCount : leadCount30;
    const unlockRate = leadCount30 > 0 ? leadsUnlocked30 / leadCount30 : 0;
    const hotShare = leadCount30 > 0 ? hotLeads30 / leadCount30 : 0;
    const winRate = leadCount30 > 0 ? wonLeads30 / leadCount30 : 0;

    // Broker gap: high lead volume per broker — capacity strain (advisory framing).
    if (brokerCount >= 1 && leadsPerBroker >= 18) {
      insights.push({
        id: makeId("broker_gap", `lpb-${Math.round(leadsPerBroker * 10)}`),
        type: "broker_gap",
        title: "Broker capacity may be stretched vs recent lead volume",
        description: `About ${leadsPerBroker.toFixed(1)} new leads per broker in the last 30 days (${leadCount30} leads, ${brokerCount} brokers). Consider growing the broker bench or improving routing efficiency — advisory only.`,
        impact: leadsPerBroker >= 35 ? "high" : leadsPerBroker >= 24 ? "medium" : "low",
      });
    }

    // Demand gap: many brokers, relatively few new leads.
    if (brokerCount >= 6 && leadCount30 < 25 && leadCount30 / Math.max(brokerCount, 1) < 1.2) {
      insights.push({
        id: makeId("demand_gap", `bc-${brokerCount}-l-${leadCount30}`),
        type: "demand_gap",
        title: "Inbound lead flow is light relative to broker supply",
        description: `${leadCount30} leads in 30 days vs ${brokerCount} broker accounts — demand generation or top-of-funnel may need attention. Suggestion only; does not auto-run campaigns.`,
        impact: leadCount30 < 12 ? "high" : leadCount30 < 18 ? "medium" : "low",
      });
    }

    // Supply gap: active FSBO inventory thin vs lead interest.
    if (activeListings < 12 && leadCount30 > 35) {
      insights.push({
        id: makeId("supply_gap", `a-${activeListings}-l-${leadCount30}`),
        type: "supply_gap",
        title: "Listing supply looks thin vs CRM lead activity",
        description: `${activeListings} active approved FSBO listings vs ${leadCount30} leads created in 30 days — consider seller acquisition or inventory programs (manual / review-first).`,
        impact: activeListings < 6 && leadCount30 > 50 ? "high" : "medium",
      });
    }

    // Conversion opportunity: unlock rate low with meaningful volume.
    if (leadCount30 >= 12 && unlockRate < 0.22) {
      insights.push({
        id: makeId("conversion_opportunity", `ur-${Math.round(unlockRate * 100)}`),
        type: "conversion_opportunity",
        title: "Lead-to-unlock conversion looks soft",
        description: `About ${Math.round(unlockRate * 100)}% of recent leads show a recorded unlock — review pricing UX, trust, and follow-up; no automatic funnel changes.`,
        impact: unlockRate < 0.12 ? "high" : unlockRate < 0.18 ? "medium" : "low",
      });
    }

    // Funnel / outcome: won rate very low (CRM proxy — not a promise of causality).
    if (leadCount30 >= 20 && winRate < 0.04) {
      insights.push({
        id: makeId("conversion_opportunity", `wr-${Math.round(winRate * 1000)}`),
        type: "conversion_opportunity",
        title: "Pipeline win rate from recent leads is very low",
        description: `Closed/won signals are rare vs ${leadCount30} new leads — worth reviewing qualification and broker follow-through (read-only signal).`,
        impact: winRate < 0.015 ? "medium" : "low",
      });
    }

    // Pricing opportunity: large share of high-score leads (advisory monetization angle).
    if (leadCount30 >= 8 && hotShare >= 0.38) {
      insights.push({
        id: makeId("pricing_opportunity", `hot-${Math.round(hotShare * 100)}`),
        type: "pricing_opportunity",
        title: "High-intent lead mix supports pricing experiments (advisory)",
        description: `Roughly ${Math.round(hotShare * 100)}% of new leads score ≥70 — review advisory unlock pricing and positioning; never auto-apply.`,
        impact: hotShare >= 0.55 ? "high" : "medium",
      });
    }
  } catch {
    /* return partial or empty — caller may show “insufficient data” */
  }

  return prioritizeFlywheelInsights(insights);
}

/**
 * Human-readable action suggestions — deterministic strings from current insights (no API side-effects).
 */
export function buildFlywheelActions(insights: MarketplaceFlywheelInsight[]): string[] {
  const actions = new Set<string>();

  for (const ins of insights) {
    switch (ins.type) {
      case "broker_gap":
        actions.add("Recruit or onboard additional brokers in priority metros (e.g. Montréal) to balance lead load.");
        actions.add("Tighten lead routing and SLA playbooks before adding paid demand.");
        break;
      case "demand_gap":
        actions.add("Increase top-of-funnel demand (content, partnerships, paid acquisition) with manual budget approval.");
        actions.add("Run a structured experiment on landing pages or referral incentives — review-only execution.");
        break;
      case "supply_gap":
        actions.add("Launch seller outreach or FSBO onboarding pushes to grow active listing inventory.");
        actions.add("Highlight listing success stories to attract more supply-side signups.");
        break;
      case "conversion_opportunity":
        actions.add("Improve conversion in the lead unlock and booking flows — A/B tests and UX reviews first.");
        actions.add("Audit follow-up speed and message quality on recent leads.");
        break;
      case "pricing_opportunity":
        actions.add("Increase pricing for high-demand lead segments using advisory dynamic pricing — confirm with ops.");
        actions.add("Align monetization copy with “Suggested price (advisory)” framing; no automatic price changes.");
        break;
      default:
        break;
    }
  }

  if (actions.size === 0) {
    actions.add("Continue monitoring weekly lead, broker, and listing ratios — no urgent flywheel flag at this snapshot.");
  }

  return [...actions];
}
