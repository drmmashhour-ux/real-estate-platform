import { CeoMarketSignals } from "./ceo-ai.types";
import { createHash } from "crypto";

/**
 * PHASE 2: CONTEXT FINGERPRINTING
 * Builds a deterministic compact fingerprint string for the CEO context.
 * This allows similar strategic situations to be compared over time.
 */
export function buildCeoContextFingerprint(context: CeoMarketSignals): string {
  // We group similar states using semantic buckets to allow pattern matching.
  
  const funnelState = context.leadsLast30d > context.leadsPrev30d ? "LEADS_UP" : "LEADS_DOWN";
  const revenueTrend = context.revenueTrend30dProxy > 0 ? "REV_POS" : "REV_NEG";
  
  // Growth efficiency: leads per indexed page proxy
  const growthEfficiency = context.leadsLast30d / (context.seoPagesIndexedApprox || 1);
  const growthEfficiencyBucket = growthEfficiency > 0.5 ? "EFF_HIGH" : growthEfficiency > 0.1 ? "EFF_MED" : "EFF_LOW";

  // Rollout / conversion health
  const rolloutHealth = context.seniorConversionRate30d > 0.08 ? "CONV_HIGH" : context.seniorConversionRate30d > 0.03 ? "CONV_MED" : "CONV_LOW";

  // Demand index (0 to 1)
  const demandBucket = context.demandIndex > 0.7 ? "DEMAND_SURGE" : context.demandIndex > 0.3 ? "DEMAND_STABLE" : "DEMAND_WEAK";

  // Market balance: operators vs brokers
  const marketBalance = context.operatorOnboardedLast90d > context.brokersJoinedLast90d ? "OP_HEAVY" : "BROKER_HEAVY";

  const components = [
    funnelState,
    revenueTrend,
    growthEfficiencyBucket,
    rolloutHealth,
    demandBucket,
    marketBalance,
  ];

  // If we had ESG or Deal specific metrics in CeoMarketSignals, we would add them here.
  // For now we use the core signals as proxies for platform state.

  const rawString = components.join("|");
  
  // Create a hash for a compact fingerprint (16 chars is enough for uniqueness of these buckets)
  return createHash("md5").update(rawString).digest("hex").slice(0, 16);
}
