import type { IntentLevel, LeadIntent, LeadRecord, RouteDecision } from "./leads.types";

export type RouteLeadInput = Pick<LeadRecord, "intent" | "source">;

/**
 * Rules-first router: investor hub, internal sales for broker/partner intent,
 * high-value buyers to top broker tier, everyone else pooled or nurtured.
 */
export function routeLead(
  lead: RouteLeadInput,
  intentLevel: IntentLevel,
  behaviors?: LeadRecord["behaviors"]
): RouteDecision {
  if (lead.intent === "INVESTOR") {
    return {
      target: "INVESTOR_PIPELINE",
      priority: intentLevel === "HIGH" ? "high" : "standard",
      notes: "Investor pipeline — diligence + deals workspace",
    };
  }

  if (lead.intent === "BROKER") {
    return {
      target: "INTERNAL_SALES",
      priority: intentLevel === "HIGH" ? "high" : "standard",
      notes: "Broker / partner intake — internal sales desk",
    };
  }

  if (lead.intent === "RENT") {
    const highRent =
      intentLevel === "HIGH" ||
      (behaviors?.listingViews != null && behaviors.listingViews >= 3);
    if (highRent) {
      return {
        target: "BROKER",
        priority: "high",
        brokerTier: "top",
        notes: "Rent intent — priority broker assignment",
      };
    }
    return {
      target: "AUTOMATED_FOLLOWUP",
      priority: "standard",
      notes: "Rent nurture sequence + broker pool overflow",
    };
  }

  // BUYER (default buyer-style traffic)
  if (intentLevel === "HIGH") {
    return {
      target: "BROKER",
      priority: "high",
      brokerTier: "top",
      notes: "High-intent buyer — listings recommendations + top broker lane",
    };
  }

  if (intentLevel === "MEDIUM") {
    return {
      target: "BROKER",
      priority: "standard",
      brokerTier: "pool",
      notes: "Buyer — curated listings + broker pool",
    };
  }

  // LOW buyer: light touch automation + broker visibility
  if (lead.source === "LANDING_PAGE" || lead.source === "MARKETING_CONTENT") {
    return {
      target: "AUTOMATED_FOLLOWUP",
      priority: "standard",
      notes: "Low-touch nurture; upgrade on engagement — CC broker queue on reply",
    };
  }

  return {
    target: "BROKER",
    priority: "standard",
    brokerTier: "pool",
    notes: "Buyer — listings + broker pool",
  };
}
