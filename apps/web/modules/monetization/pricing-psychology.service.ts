import { prisma } from "@/lib/db";
import { getPsychologicalPricing, PricingDisplay } from "./quebec-pricing.config";
import { getBrokerAbVariant } from "./pricing-analytics.service";

export async function getBrokerPricingContext(userId: string, leadId?: string) {
  // Check if first purchase
  const purchasedLeadsCount = await prisma.lead.count({
    where: { purchasedByBrokerId: userId }
  });

  const isFirstPurchase = purchasedLeadsCount === 0;
  const abVariant = getBrokerAbVariant(userId);

  // If leadId provided, get lead-specific quality/demand
  let leadQuality: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  let demandLevel: "HIGH" | "NORMAL" | "LOW" = "NORMAL";
  let location: string | null = null;

  if (leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { 
        score: true, 
        purchaseRegion: true,
        conversionProbability: true
      }
    });

    if (lead) {
      if ((lead.score ?? 0) >= 80 || (lead.conversionProbability ?? 0) >= 0.7) {
        leadQuality = "HIGH";
      } else if ((lead.score ?? 0) < 40) {
        leadQuality = "LOW";
      }

      location = lead.purchaseRegion;
      // Heuristic: high demand in Montreal/Laval
      if (location?.toLowerCase().includes("montreal") || location?.toLowerCase().includes("laval")) {
        demandLevel = "HIGH";
      }
    }
  }

  return {
    isFirstPurchase,
    leadQuality,
    demandLevel,
    location,
    abVariant
  };
}

export async function getLeadPricingForBroker(userId: string, leadId: string): Promise<PricingDisplay> {
  const context = await getBrokerPricingContext(userId, leadId);
  return getPsychologicalPricing(context);
}
