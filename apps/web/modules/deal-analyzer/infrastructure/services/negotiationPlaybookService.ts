import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { MarketConditionKind } from "@/modules/deal-analyzer/domain/negotiationPlaybooks";

export type PlaybookStep = { step: string; rationale: string };

export function buildNegotiationPlaybook(args: {
  marketCondition: MarketConditionKind;
  posture: string;
  trustScore: number | null;
}): { steps: PlaybookStep[]; warnings: string[]; confidenceLevel: "low" | "medium" | "high" } {
  const warnings: string[] = [dealAnalyzerConfig.phase4.disclaimers.playbook];
  const t = args.trustScore ?? 0;
  if (t < 50) warnings.push("Low listing trust/readiness — keep protective conditions and extra diligence.");

  let confidence: "low" | "medium" | "high" = "medium";
  if (args.marketCondition === MarketConditionKind.UNCERTAIN || t < 45) confidence = "low";
  if (args.marketCondition === MarketConditionKind.BALANCED && t >= 60) confidence = "high";

  const steps: PlaybookStep[] = [];

  if (args.marketCondition === MarketConditionKind.BUYER_FAVORABLE) {
    steps.push({
      step: "Favor disciplined opening positions",
      rationale: "Platform comparables suggest more room to negotiate — still keep financing and inspection protections.",
    });
    steps.push({
      step: "Request documentation early",
      rationale: "Verify disclosures before increasing offer strength.",
    });
  } else if (args.marketCondition === MarketConditionKind.SELLER_FAVORABLE) {
    steps.push({
      step: "Stay closer to ask with standard conditions",
      rationale: "Signals lean seller-side on-platform — avoid aggressive waivers by default.",
    });
    steps.push({
      step: "Escalate only with strong justification",
      rationale: "Use extra comparables or material listing clarity before raising.",
    });
  } else if (args.marketCondition === MarketConditionKind.BALANCED) {
    steps.push({
      step: "Balanced negotiation path",
      rationale: "Use near-median bands and typical timelines for your market.",
    });
  } else {
    steps.push({
      step: "Cautious / uncertain market data",
      rationale: "Comparable coverage or confidence is limited — widen diligence, avoid sharp escalations.",
    });
    steps.push({
      step: "Preserve protections",
      rationale: "Do not remove essential conditions by default.",
    });
  }

  steps.push({
    step: `Posture context: ${args.posture.replace(/_/g, " ")}`,
    rationale: "Rules-based posture from Deal Analyzer — not a guarantee of acceptance.",
  });

  return { steps, warnings, confidenceLevel: confidence };
}
