import { InvestorMetrics } from "./metrics.service";

export interface InvestorNarrative {
  problem: string;
  solution: string;
  traction: string;
  vision: string;
  highlights: string[];
  risks: string[];
  opportunities: string[];
}

export function generateInvestorNarrative(metrics: InvestorMetrics): InvestorNarrative {
  const isHighGrowth = metrics.revenueGrowthMonthOverMonth > 0.2;
  const isGoodRetention = metrics.brokerRetentionRate > 0.4;

  return {
    problem: "Québec real estate brokers waste 40% of their time chasing low-intent leads and struggling with OACIQ compliance paperwork.",
    solution: "LECIPM: An AI-first command center that identifies high-conversion value and automates compliant drafting in seconds, not hours.",
    traction: `We have onboarded ${metrics.activeBrokers} active brokers with a ${ (metrics.leadConversionRate * 100).toFixed(1) }% lead purchase rate and ${ (metrics.brokerRetentionRate * 100).toFixed(1) }% repeat purchase rate.`,
    vision: "To become the dominant AI operating system for real estate in Canada, starting with Québec's $2B commission market.",
    highlights: [
      `${metrics.activeBrokers} active brokers onboarded`,
      `$${metrics.totalRevenueCad.toLocaleString()} total revenue processed`,
      isHighGrowth ? "Strong month-over-month revenue growth" : "Steady market entry in Montréal",
      isGoodRetention ? "High broker retention and repeat usage" : "Growing broker engagement in priority markets"
    ],
    risks: [
      "Regulatory changes in Québec real estate law (OACIQ)",
      "Adoption speed among older broker cohorts",
      "Competition from generic US-based AI tools"
    ],
    opportunities: [
      "Expansion to Ontario and BC markets",
      "Integration with mortgage and insurance partners",
      "Premium 'Full Autopilot' mode for top teams"
    ]
  };
}
