import { CeoMarketSignals, CeoDecisionProposal } from "./ceo-ai.types";

/**
 * PHASE 5: CEO INTEGRATION (CAPITAL DOMAIN)
 * Proposes strategic shifts in capital allocation based on market signals.
 */
export async function proposeCapitalDecisions(signals: CeoMarketSignals): Promise<CeoDecisionProposal[]> {
  const proposals: CeoDecisionProposal[] = [];

  // 1. Check for high demand vs low conversion
  if (signals.demandIndex > 0.8 && signals.seniorConversionRate30d < 0.15) {
    proposals.push({
      domain: "CAPITAL",
      title: "Shift to AGGRESSIVE Capital Allocation",
      summary: "High demand with sub-optimal conversion suggests opportunity for more aggressive capital deployment to capture market share.",
      rationale: `Demand index is high (${(signals.demandIndex * 100).toFixed(0)}%) but conversion is low. Aggressive allocation can accelerate deal execution.`,
      confidence: 0.75,
      impactEstimate: 0.2,
      requiresApproval: true,
      payload: {
        kind: "capital_strategy_shift",
        targetMode: "AGGRESSIVE",
        rationale: "Capturing high market demand via accelerated deployment.",
      },
    });
  }

  // 2. Check for market slowdown
  if (signals.revenueTrend30dProxy < -0.1) {
    proposals.push({
      domain: "CAPITAL",
      title: "Shift to CONSERVATIVE Capital Allocation",
      summary: "Downward revenue trend detected. Shifting to conservative mode to preserve capital and focus on low-risk deals.",
      rationale: `Revenue trend is negative (${(signals.revenueTrend30dProxy * 100).toFixed(1)}%). Conservative posture reduces exposure during market volatility.`,
      confidence: 0.85,
      impactEstimate: 0.15,
      requiresApproval: true,
      payload: {
        kind: "capital_strategy_shift",
        targetMode: "CONSERVATIVE",
        rationale: "Capital preservation during market slowdown.",
      },
    });
  }

  // 3. ESG Opportunity (if demand is stable)
  if (signals.demandIndex > 0.5 && signals.revenueTrend30dProxy >= 0) {
    proposals.push({
      domain: "CAPITAL",
      title: "Pivot to ESG_FOCUSED Allocation",
      summary: "Stable market conditions allow for strategic pivot towards high-ESG impact deals to improve long-term portfolio resilience.",
      rationale: "Aligning capital deployment with sustainability goals during stable growth periods.",
      confidence: 0.65,
      impactEstimate: 0.1,
      requiresApproval: true,
      payload: {
        kind: "capital_strategy_shift",
        targetMode: "ESG_FOCUSED",
        rationale: "Strategic alignment with long-term ESG mandates.",
      },
    });
  }

  return proposals;
}
