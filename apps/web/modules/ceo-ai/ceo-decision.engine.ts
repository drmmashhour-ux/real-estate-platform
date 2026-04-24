import { CeoContext, CeoDecision, CeoInsight, CeoDecisionType, CeoDomain } from "./ceo.types";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import { CeoMemoryContextService } from "./ceo-memory-context.service";

export class CeoDecisionEngine {
  static async generateCeoDecisions(insights: CeoInsight[], context: CeoContext): Promise<CeoDecision[]> {
    const decisions: CeoDecision[] = [];
    const fingerprint = CeoMemoryContextService.buildCeoContextFingerprint(context);

    // Fetch relevant patterns for memory-aware boosting/penalizing
    const patterns = await prisma.ceoStrategyPattern.findMany({
      where: { contextFingerprint: fingerprint },
    });

    const patternMap = new Map(patterns.map(p => [`${p.domain}_${p.contextFingerprint}`, p]));

    for (const insight of insights) {
      let decision: CeoDecision | null = null;
      let memorySignal = "neutral";
      let confidenceBoost = 0;

      if (insight.type === "GROWTH" && insight.severity === "high") {
        const pattern = patternMap.get(`MARKETING_${fingerprint}`);
        if (pattern && pattern.score > 2) {
          memorySignal = "positive history boost";
          confidenceBoost = 0.1;
        } else if (pattern && pattern.score < -2) {
          memorySignal = "negative history penalty";
          confidenceBoost = -0.15;
        }

        decision = {
          id: uuidv4(),
          decisionType: "INVEST",
          domain: "MARKETING",
          payloadJson: { allocationIncrease: 0.2, channelFocus: ["SEARCH", "SOCIAL"], memorySignal },
          reasoning: `Growth trend is negative (${context.growth.trend}). Recommending budget increase. Memory Signal: ${memorySignal}.`,
          confidence: Math.min(1, Math.max(0.1, 0.85 + confidenceBoost)),
          createdAt: new Date(),
          insightIds: [insight.id],
        };
      } else if (insight.type === "EFFICIENCY" && insight.severity === "high") {
        const pattern = patternMap.get(`DEALS_${fingerprint}`);
        if (pattern && pattern.score > 2) {
          memorySignal = "positive history boost";
          confidenceBoost = 0.1;
        }

        decision = {
          id: uuidv4(),
          decisionType: "SHIFT_FOCUS",
          domain: "DEALS",
          payloadJson: { targetCloseRate: 0.1, filteringStrictness: "high", memorySignal },
          reasoning: `Low deal conversion. Shifting focus to quality. Memory Signal: ${memorySignal}.`,
          confidence: Math.min(1, Math.max(0.1, 0.75 + confidenceBoost)),
          createdAt: new Date(),
          insightIds: [insight.id],
        };
      } else if (insight.title.includes("ESG") && insight.type === "OPPORTUNITY") {
        decision = {
          id: uuidv4(),
          decisionType: "EXPERIMENT",
          domain: "ESG",
          payloadJson: { experimentType: "GREEN_LISTING_BOOST", durationDays: 14 },
          reasoning: "Low ESG adoption. Boosting green listings.",
          confidence: 0.65,
          createdAt: new Date(),
          insightIds: [insight.id],
        };
      } else if (insight.type === "RISK" && insight.severity === "high") {
        decision = {
          id: uuidv4(),
          decisionType: "REDUCE",
          domain: "PRODUCT",
          payloadJson: { reduceAutomationIntensity: 0.5 },
          reasoning: "Agent reliability drift. Reducing automation intensity.",
          confidence: 0.9,
          createdAt: new Date(),
          insightIds: [insight.id],
        };
      }

      if (decision) {
        decisions.push(decision);
      }
    }

    return decisions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
}
