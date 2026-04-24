import { identifyFunnelBottlenecks } from "./context.service";
import { GrowthHypothesis } from "./growth.types";
import { logInfo } from "@/lib/logger";

const TAG = "[growth-engine]";

/**
 * Generates growth hypotheses based on funnel bottlenecks.
 */
export async function generateGrowthHypotheses(): Promise<GrowthHypothesis[]> {
  const bottlenecks = await identifyFunnelBottlenecks();
  const hypotheses: GrowthHypothesis[] = [];

  for (const b of bottlenecks) {
    if (b.stage === "Activation") {
      hypotheses.push({
        hypothesis: "Reduce onboarding friction from 3 steps to 2 to improve activation rate.",
        channel: "ONBOARDING",
        targetMetric: "activationRate",
        expectedImpact: "Activation",
        confidence: 0.8,
        requiredAssets: ["Product adjustment"],
        riskLevel: "MEDIUM",
      });
      hypotheses.push({
        hypothesis: "Show AI guide CTA earlier in the flow to demonstrate value moment.",
        channel: "CONTENT",
        targetMetric: "activationRate",
        expectedImpact: "Activation",
        confidence: 0.7,
        requiredAssets: ["UI module"],
        riskLevel: "LOW",
      });
    }

    if (b.stage === "Acquisition") {
      hypotheses.push({
        hypothesis: "Improve landing headline for broker conversion to increase signup rate.",
        channel: "LANDING",
        targetMetric: "landingConversion",
        expectedImpact: "Acquisition",
        confidence: 0.65,
        requiredAssets: ["Copywriting"],
        riskLevel: "LOW",
      });
      hypotheses.push({
        hypothesis: "Promote testimonials higher on landing to increase trust and conversion.",
        channel: "LANDING",
        targetMetric: "landingConversion",
        expectedImpact: "Acquisition",
        confidence: 0.75,
        requiredAssets: ["UI adjustment"],
        riskLevel: "LOW",
      });
    }

    if (b.stage === "Viral Loop") {
      hypotheses.push({
        hypothesis: "Prioritize referral loop for activated brokers with a first-success bonus.",
        channel: "REFERRAL",
        targetMetric: "referralUsage",
        expectedImpact: "Acquisition",
        confidence: 0.9,
        requiredAssets: ["Email template", "UI prompt"],
        riskLevel: "MEDIUM",
      });
    }
  }

  // Add monetization hypothesis
  hypotheses.push({
    hypothesis: "Test lower first-lead price for new brokers to accelerate first purchase.",
    channel: "PRICING",
    targetMetric: "pricingConversion",
    expectedImpact: "Monetization",
    confidence: 0.85,
    requiredAssets: ["Pricing rule adjustment"],
    riskLevel: "HIGH",
  });

  logInfo(`${TAG} hypothesis_generated`, { count: hypotheses.length });
  return hypotheses;
}
