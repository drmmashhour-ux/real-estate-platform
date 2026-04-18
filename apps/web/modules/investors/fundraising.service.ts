import type { FundraisingMetric, FundraisingNarrative } from "./fundraising.types";

export function buildFundraisingNarrative(): FundraisingNarrative {
  return {
    problem: "Real estate lead generation is inefficient and poorly matched.",
    solution: "AI-powered marketplace optimizing lead quality, routing, and conversion.",
    traction: "Growing leads, broker network, conversion improvements.",
    vision: "Autonomous real estate marketplace.",
  };
}

/** Advisory KPIs for decks — replace with audited figures before investor circulation. */
export function buildFundraisingMetrics(): FundraisingMetric[] {
  return [
    { name: "North-star", value: "Qualified leads / broker / month (target by stage)" },
    { name: "Unit economics", value: "CAC vs. LTV — track in revenue + CRM (read-only panels)" },
    { name: "Moat", value: "Data + network + routing intelligence (see Moat Engine)" },
    { name: "GTM", value: "City-by-city density; BNHub as supply expansion wedge" },
  ];
}
