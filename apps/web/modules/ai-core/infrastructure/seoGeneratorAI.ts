import type { AiSeoPayload } from "../domain/types";

function titleCase(v: string): string {
  return v
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0]?.toUpperCase() + x.slice(1).toLowerCase())
    .join(" ");
}

export function generateListingSeo(input: {
  city: string;
  address: string;
  trustScore: number | null;
  dealScore: number | null;
}): AiSeoPayload {
  const city = titleCase(input.city);
  const title = `Is ${input.address} a good deal? ${city} analysis | LECIPM`;
  const description = `AI-assisted property analysis for ${input.address}, ${city}: trust ${input.trustScore ?? "—"}, deal ${input.dealScore ?? "—"}, risk and recommendations.`;
  const keywords = [
    `is this property a good deal ${city.toLowerCase()}`,
    `investment property analysis ${city.toLowerCase()}`,
    `real estate deal analyzer ${city.toLowerCase()}`,
  ];
  return {
    title,
    description,
    headings: ["Price Analysis", "Trust Score Breakdown", "Deal Score & Risk", "What To Do Next"],
    keywords,
    bodyPreview:
      "This listing is evaluated using deterministic scoring from trust and deal engines. The page explains upside, risk, and practical next steps.",
  };
}

export function generateAreaSeo(input: { city: string }): AiSeoPayload {
  const city = titleCase(input.city);
  const title = `Best areas to invest in ${city} | LECIPM Market Intelligence`;
  return {
    title,
    description: `Demand, average prices, ROI context, and deal signals for ${city} investors and brokers.`,
    headings: ["Demand Snapshot", "Average Price Trends", "ROI Context", "Top Opportunities"],
    keywords: [
      `best areas to invest in ${city.toLowerCase()}`,
      `real estate ROI ${city.toLowerCase()}`,
      `property investment ${city.toLowerCase()}`,
    ],
    bodyPreview:
      "Area intelligence combines market trend data with platform scoring signals to highlight where investors can focus.",
  };
}

export function generateBlogSeo(input: { city: string; topic?: string }): AiSeoPayload {
  const city = titleCase(input.city);
  const topic = input.topic?.trim() || "Top deals today";
  const title = `${topic} in ${city} | LECIPM`;
  return {
    title,
    description: `Daily AI-assisted blog insights for ${city}: top opportunities, risk flags, and deal quality trends.`,
    headings: ["Top Deals Today", "Risk Flags", "Why These Areas", "Action Plan For Buyers"],
    keywords: [
      `top deals ${city.toLowerCase()} today`,
      `market trends ${city.toLowerCase()}`,
      `real estate insights ${city.toLowerCase()}`,
    ],
    bodyPreview:
      "Today we review the highest-scoring opportunities and explain why they rank well using trust, deal, and market signals.",
  };
}
