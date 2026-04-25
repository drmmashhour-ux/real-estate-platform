import { prisma } from "@/lib/db";

export type ConversionEvent = {
  brokerId: string;
  leadId?: string;
  pricingType: string;
  price: number;
  originalPrice?: number;
  variant?: string;
  outcome: "VIEW" | "CLICK" | "PURCHASE" | "CANCEL";
};

export async function trackPricingConversion(event: ConversionEvent) {
  // We can use a dedicated table or log events to an existing telemetry system
  // For now, let's log it to console for visibility and we could use an existing Telemetry model if it exists
  console.log(`[monetization][conversion] Broker ${event.brokerId} Lead ${event.leadId} Pricing ${event.pricingType} Price ${event.price} Outcome ${event.outcome} Variant ${event.variant}`);
  
  // In a real scenario, we'd persist this to BigQuery or a specialized analytics table
}

export function getBrokerAbVariant(userId: string): string {
  // Simple deterministic variant based on userId
  const lastChar = userId.slice(-1);
  const code = lastChar.charCodeAt(0);
  
  // 50/50 test for first lead price
  if (code % 2 === 0) return "FIRST_LEAD_99";
  return "FIRST_LEAD_79";
}
