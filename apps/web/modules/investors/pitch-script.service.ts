import type { PitchScript } from "./pitch-script.types";

const SCRIPT_60 =
  "We're building LECIPM, an AI-powered real estate marketplace that connects high-intent buyers with top-performing brokers.\n\n" +
  "Today, lead generation is broken — brokers pay for low-quality leads with poor conversion.\n\n" +
  "We solve this by scoring leads, routing them intelligently, and optimizing pricing dynamically.\n\n" +
  "We're already onboarding brokers and generating leads, and we're building toward a fully autonomous marketplace.\n\n" +
  "Our goal is to dominate city-by-city and become the intelligence layer of real estate transactions.";

const SCRIPT_5 =
  "Problem:\n" +
  "Real estate lead generation is inefficient and expensive.\n\n" +
  "Solution:\n" +
  "LECIPM connects high-intent buyers with top brokers using AI.\n\n" +
  "Product:\n" +
  "Lead scoring, routing, pricing, growth engine.\n\n" +
  "Traction:\n" +
  "Early brokers, leads, and conversions.\n\n" +
  "Business Model:\n" +
  "Pay-per-lead, subscriptions, transaction fees.\n\n" +
  "Vision:\n" +
  "Autonomous marketplace dominating cities.";

export function getInvestorPitchScripts(): PitchScript[] {
  return [
    { type: "60_sec", script: SCRIPT_60 },
    { type: "5_min", script: SCRIPT_5 },
  ];
}
