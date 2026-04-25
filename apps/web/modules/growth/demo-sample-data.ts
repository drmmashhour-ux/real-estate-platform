/**
 * Static sample deals for the 3-minute broker call demo. No PII — fictional Québec-style scenarios.
 * When `demo=true`, the UI always uses this set; it can also be used to label CRM rows seeded by assign-sample.
 */

export type DemoDealRow = {
  id: string;
  /** Short list label */
  label: string;
  area: string;
  /** 0–100, shown as “chance to close” */
  closeScore: number;
  risk: string;
  engagement: string;
  showHighPriority: boolean;
  showHighProbability: boolean;
  /** Plain-language “because” for the rep to read */
  insightBecause: string;
  suggestedAction: string;
  messageDraft: string;
  pipelineLabel: "New" | "Qualified" | "Offer" | "Closing";
};

export const BROKER_DEMO_DEALS: DemoDealRow[] = [
  {
    id: "demo-1",
    label: "Plateau · Condo",
    area: "Le Plateau",
    closeScore: 78,
    risk: "Financing",
    engagement: "Replied twice this week",
    showHighPriority: true,
    showHighProbability: true,
    insightBecause: "strong replies and a clear next step on financing",
    suggestedAction: "Call to confirm their broker has the pre-approval update.",
    messageDraft:
      "Hi — quick one: is your financing lined up the same way as last time? I can line up a showing window that matches.",
    pipelineLabel: "Offer",
  },
  {
    id: "demo-2",
    label: "Laval · Duplex",
    area: "Laval",
    closeScore: 52,
    risk: "Competing offer",
    engagement: "Opened last email, no reply",
    showHighPriority: false,
    showHighProbability: false,
    insightBecause: "interest is real but timing is slower",
    suggestedAction: "Send a one-line check-in with two concrete time options.",
    messageDraft: "Hi — are you free Tuesday late afternoon or Wednesday morning? I can hold a short call either way.",
    pipelineLabel: "Qualified",
  },
  {
    id: "demo-3",
    label: "Longueuil · House",
    area: "Longueuil",
    closeScore: 28,
    risk: "Early browse",
    engagement: "Single portal lead",
    showHighPriority: false,
    showHighProbability: false,
    insightBecause: "still early — better as nurture than push",
    suggestedAction: "Add to follow-up in 4–5 days; keep the tone light.",
    messageDraft: "Thanks for the note — I’ll keep you posted when a fit shows up. Any must-haves I should watch for?",
    pipelineLabel: "New",
  },
];

/** The deal the demo highlights as #1 to focus on. */
export const BROKER_DEMO_TOP_DEAL = BROKER_DEMO_DEALS[0]!;

export function getDemoPipelineSnapshot() {
  const stages = ["New", "Qualified", "Offer", "Closing"] as const;
  return stages.map((stage) => ({
    stage,
    count: BROKER_DEMO_DEALS.filter((d) => d.pipelineLabel === stage).length,
  }));
}
