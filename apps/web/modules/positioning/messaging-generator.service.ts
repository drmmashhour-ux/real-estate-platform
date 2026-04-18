import type { CompetitorId } from "./competitor-analysis.service";

export type MessagingAngle = {
  title: string;
  body: string;
  proofRequired: string[];
};

export function buildMessagingAngles(competitor: CompetitorId): MessagingAngle[] {
  const vs =
    competitor === "airbnb"
      ? "short-term marketplaces"
      : competitor === "centris"
        ? "MLS-style listing portals"
        : "generic listing feeds";

  return [
    {
      title: "One platform for stays and regulated resale workflows",
      body: `LECIPM pairs BNHub hospitality with Québec brokerage tooling — unlike ${vs} that optimize for a single slice.`,
      proofRequired: ["Live BNHub listings", "Brokerage deal pipeline counts (internal)"],
    },
    {
      title: "AI under human review — not autopilot claims",
      body: "Drafting and copilots are framed as review-first, matching OACIQ-sensitive expectations.",
      proofRequired: ["Product screenshots", "Audit logs for AI-assisted drafts"],
    },
    {
      title: "Investor-grade metrics without vanity fluff",
      body: "Dashboards pull Prisma-backed counts; exports are CSV/JSON for diligence.",
      proofRequired: ["Sample export", "Metric lineage table"],
    },
  ];
}
