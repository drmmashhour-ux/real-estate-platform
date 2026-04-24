import { 
  CapitalAllocationInput, 
  CapitalAllocationPlan, 
  CapitalAllocationDecision,
  DealAllocationInput,
  AllocationStrategyMode
} from "./capital-allocator.types";
import { CapitalDealScoringService } from "./capital-deal-scoring.service";

/**
 * PHASE 3: ALLOCATION ENGINE
 * Proposes optimal capital allocation across active deals based on strategy and constraints.
 */
export class CapitalAllocatorEngine {
  /**
   * Generates a capital allocation plan based on input deals and constraints.
   */
  static generateCapitalAllocation(input: CapitalAllocationInput): CapitalAllocationPlan {
    const { deals, totalCapitalAvailable, strategyMode, constraints } = input;

    // 1. Filter Eligible Deals
    const eligibleDeals = deals.filter(deal => {
      if (deal.status === "AVOID" || deal.status === "REJECTED") return false;
      if (deal.complianceScore < 0.5) return false; // Safety floor
      return true;
    });

    if (eligibleDeals.length === 0) {
      return this.emptyPlan(totalCapitalAvailable, strategyMode);
    }

    // 2. Rank and Score Deals
    const scoredDeals = eligibleDeals.map(deal => ({
      deal,
      score: this.getAdjustedScore(deal, strategyMode),
    })).sort((a, b) => b.score - a.score);

    // 3. Proportional Allocation
    const totalScore = scoredDeals.reduce((sum, d) => sum + d.score, 0);
    let remainingCapital = totalCapitalAvailable;
    const allocations: CapitalAllocationDecision[] = [];

    // First pass: Proportional allocation with constraints
    for (const item of scoredDeals) {
      const { deal, score } = item;
      
      // Proportional amount based on score
      let amount = (score / totalScore) * totalCapitalAvailable;
      
      // Enforce maxPerDealPercent
      const maxAmount = totalCapitalAvailable * constraints.maxPerDealPercent;
      if (amount > maxAmount) {
        amount = maxAmount;
      }

      // Enforce risk constraints
      if (constraints.maxRiskExposure === "LOW" && deal.riskLevel === "HIGH") {
        amount = 0; // Skip high risk if constraint is LOW
      }

      if (amount > 0) {
        allocations.push({
          dealId: deal.dealId,
          title: deal.title,
          allocatedAmount: amount,
          allocationPercent: amount / totalCapitalAvailable,
          normalizedScore: score,
          rationale: CapitalDealScoringService.generateRationale(deal, score),
          riskLevel: deal.riskLevel,
          esgImpact: this.getEsgImpactNote(deal),
          expectedOutcome: this.getExpectedOutcomeNote(deal),
        });
        remainingCapital -= amount;
      }
    }

    // 4. Rebalance (Distribute remaining capital if any, while respecting constraints)
    if (remainingCapital > 1 && allocations.length > 0) {
      this.rebalance(allocations, remainingCapital, totalCapitalAvailable, constraints);
    }

    // 5. Final Plan Metrics
    const allocatedTotal = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    
    return {
      totalCapital: totalCapitalAvailable,
      allocatedCapital: allocatedTotal,
      availableCapital: totalCapitalAvailable - allocatedTotal,
      strategyMode,
      allocations,
      summary: this.generatePlanSummary(allocations, strategyMode),
      diversificationScore: Math.min(1, allocations.length / constraints.minDiversificationCount),
      riskScore: this.calculateRiskScore(allocations),
    };
  }

  /**
   * Adjusts the base normalized score based on the selected strategy.
   */
  private static getAdjustedScore(deal: DealAllocationInput, mode: AllocationStrategyMode): number {
    const baseScore = CapitalDealScoringService.normalizeDealScore(deal);
    
    switch (mode) {
      case "CONSERVATIVE":
        return deal.riskLevel === "LOW" ? baseScore * 1.2 : baseScore * 0.5;
      case "AGGRESSIVE":
        return deal.riskLevel === "HIGH" ? baseScore * 1.5 : baseScore * 0.8;
      case "ESG_FOCUSED":
        return deal.esgScore > 0.7 ? baseScore * 1.4 : baseScore * 0.7;
      case "BALANCED":
      default:
        return baseScore;
    }
  }

  /**
   * Rebalances allocations to utilize remaining capital while respecting caps.
   */
  private static rebalance(
    allocations: CapitalAllocationDecision[], 
    remaining: number, 
    total: number, 
    constraints: AllocationConstraints
  ) {
    const maxAmount = total * constraints.maxPerDealPercent;
    
    // Sort by score to prioritize better deals for rebalance
    allocations.sort((a, b) => b.normalizedScore - a.normalizedScore);

    for (let i = 0; i < allocations.length && remaining > 0; i++) {
      const a = allocations[i];
      const room = maxAmount - a.allocatedAmount;
      if (room > 0) {
        const add = Math.min(room, remaining);
        a.allocatedAmount += add;
        a.allocationPercent = a.allocatedAmount / total;
        remaining -= add;
      }
    }
  }

  private static calculateRiskScore(allocations: CapitalAllocationDecision[]): number {
    if (allocations.length === 0) return 0;
    const riskMap = { LOW: 0.2, MEDIUM: 0.5, HIGH: 0.9 };
    const weightedRisk = allocations.reduce((sum, a) => sum + (riskMap[a.riskLevel] * a.allocationPercent), 0);
    return weightedRisk;
  }

  private static getEsgImpactNote(deal: DealAllocationInput): string {
    if (deal.esgScore > 0.8) return "High positive impact on sustainability goals.";
    if (deal.esgScore > 0.5) return "Neutral to positive ESG impact.";
    return "Baseline ESG compliance.";
  }

  private static getExpectedOutcomeNote(deal: DealAllocationInput): string {
    return `Targeting directional growth in ${deal.region} aligned with ${deal.dealStage} phase parameters.`;
  }

  private static generatePlanSummary(allocations: CapitalAllocationDecision[], mode: AllocationStrategyMode): string {
    if (allocations.length === 0) return "No allocations possible with current constraints and deals.";
    return `Capital allocation plan generated using ${mode} strategy across ${allocations.length} deals. Prioritizing ${mode === "ESG_FOCUSED" ? "sustainability" : "risk-adjusted returns"}.`;
  }

  private static emptyPlan(total: number, mode: AllocationStrategyMode): CapitalAllocationPlan {
    return {
      totalCapital: total,
      allocatedCapital: 0,
      availableCapital: total,
      strategyMode: mode,
      allocations: [],
      summary: "No eligible deals found for allocation.",
      diversificationScore: 0,
      riskScore: 0,
    };
  }
}
