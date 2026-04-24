import { 
  CeoContext, 
  CeoDecision, 
  CeoDecisionType, 
  CeoDecisionDomain, 
  CeoInsight 
} from "./ceo.types";
import { v4 as uuidv4 } from "uuid";

/**
 * PHASE 4: DECISION ENGINE
 * Converts insights into high-level strategic decisions.
 */
export function generateCeoDecisions(
  insights: CeoInsight[], 
  context: CeoContext
): CeoDecision[] {
  const decisions: CeoDecision[] = [];

  for (const insight of insights) {
    let decision: CeoDecision | null = null;

    if (insight.type === "GROWTH" && insight.severity === "high") {
      decision = {
        id: uuidv4(),
        decisionType: "INVEST",
        domain: "MARKETING",
        payloadJson: { 
          action: "increase_ad_spend", 
          target: "low_conversion_segments",
          allocation: 5000 
        },
        reasoning: `Growth is critical due to: ${insight.title}. Investing in marketing to boost lead flow.`,
        confidence: 0.85,
        createdAt: new Date(),
      };
    } else if (insight.type === "DEALS" as any) {
      decision = {
        id: uuidv4(),
        decisionType: "SHIFT_FOCUS",
        domain: "DEALS",
        payloadJson: { 
          focus: "quality", 
          criteria: ["higher_underwriting_score", "vetted_operators"] 
        },
        reasoning: `Deal efficiency is low: ${insight.title}. Shifting focus to deal quality over volume.`,
        confidence: 0.75,
        createdAt: new Date(),
      };
    } else if (insight.type === "OPPORTUNITY" && insight.title.includes("ESG")) {
      decision = {
        id: uuidv4(),
        decisionType: "INVEST",
        domain: "ESG",
        payloadJson: { 
          action: "promote_green_listings", 
          incentive: "featured_badge_discount" 
        },
        reasoning: `ESG performance is strong: ${insight.title}. Investing in green listing promotion.`,
        confidence: 0.7,
        createdAt: new Date(),
      };
    } else if (insight.type === "RISK" && insight.severity === "high") {
      decision = {
        id: uuidv4(),
        decisionType: "REDUCE",
        domain: "PRODUCT",
        payloadJson: { 
          action: "limit_experimentation", 
          max_active_rollouts: 2 
        },
        reasoning: `High risk detected: ${insight.title}. Reducing experimentation intensity to stabilize.`,
        confidence: 0.9,
        createdAt: new Date(),
      };
    }

    if (decision) {
      decisions.push(decision);
    }
  }

  // Safety cap: max 5 decisions as per Phase 9
  return decisions.slice(0, 5);
}
