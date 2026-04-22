import { prisma } from "@/lib/db";
import { MARKET_PRICING_TYPES } from "@/modules/monetization/dynamic-market-pricing.service";
import type { CeoDecisionProposal, CeoMarketSignals } from "@/modules/ceo-ai/ceo-ai.types";

/** Proposes pricing moves; execution applies deltas with streak guard (see ceo-ai.service). */

export async function proposePricingDecisions(signals: CeoMarketSignals): Promise<CeoDecisionProposal[]> {
  const out: CeoDecisionProposal[] = [];

  if (signals.demandIndex > 0.62 && signals.seniorConversionRate30d >= 0.065) {
    const rel = 0.035;
    out.push({
      domain: "PRICING",
      title: "Raise LEAD reference in high-demand window",
      summary:
        "Demand + conversion healthy — modest LEAD fee increase captures value while staying inside guardrails.",
      rationale: `DemandIdx ${signals.demandIndex.toFixed(2)}, conv ${(signals.seniorConversionRate30d * 100).toFixed(1)}%.`,
      confidence: 0.69,
      impactEstimate: rel,
      requiresApproval: rel >= 0.05,
      payload: { kind: "pricing_lead_adjust", segment: "LEAD_GLOBAL", relativeDelta: rel },
    });
  }

  if (signals.demandIndex < 0.42 && signals.leadsLast30d > 20 && signals.seniorConversionRate30d < 0.055) {
    const rel = -0.04;
    out.push({
      domain: "PRICING",
      title: "Ease LEAD friction for lagging conversion cohort",
      summary:
        "High lead volume but weak conversion suggests price sensitivity — small fee reduction experiment.",
      rationale:
        "Pairs soft demand index with trailing conversion to avoid silent funnel leakage to competitors.",
      confidence: 0.62,
      impactEstimate: Math.abs(rel),
      requiresApproval: true,
      payload: { kind: "pricing_lead_adjust", segment: "LOW_CONVERT_SEGMENT", relativeDelta: rel },
    });
  }

  const featuredRule = await prisma.lecipmMarketPricingRule.findUnique({
    where: { type: MARKET_PRICING_TYPES.FEATURED },
  });
  if (featuredRule && signals.seoPagesIndexedApprox > 80 && signals.revenueTrend30dProxy > 0.08) {
    const rel = 0.045;
    out.push({
      domain: "PRICING",
      title: "Featured placement micro-test (+4.5%)",
      summary: "Organic surface is mature — monetize incremental inventory without aggressive jumps.",
      rationale: `Featured base ${featuredRule.basePrice}; SEO inventory ~${signals.seoPagesIndexedApprox}.`,
      confidence: 0.55,
      impactEstimate: rel,
      requiresApproval: rel >= 0.05,
      payload: { kind: "pricing_featured_adjust", relativeDelta: rel },
    });
  }

  return out;
}
