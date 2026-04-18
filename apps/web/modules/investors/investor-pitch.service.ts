import type { InvestorPitch } from "./investor-pitch.types";

/**
 * Static narrative — not LLM-generated; safe for operator review.
 */
export function buildInvestorPitch(): InvestorPitch {
  return {
    slides: [
      {
        title: "Problem",
        content: ["Real estate lead generation is inefficient, expensive, and poorly matched."],
      },
      {
        title: "Solution",
        content: ["LECIPM is an AI-powered marketplace connecting high-intent buyers with top brokers."],
      },
      {
        title: "Product",
        content: ["Lead scoring, smart routing, dynamic pricing, AI growth engine."],
      },
      {
        title: "Market",
        content: ["Massive real estate market with fragmented lead systems."],
      },
      {
        title: "Traction",
        content: ["Growing leads, broker onboarding, early conversions."],
      },
      {
        title: "Business Model",
        content: ["Pay-per-lead, subscriptions, transaction fees."],
      },
      {
        title: "Vision",
        content: ["Autonomous real estate marketplace."],
      },
    ],
  };
}
