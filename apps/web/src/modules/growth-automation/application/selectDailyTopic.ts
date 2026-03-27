import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";

const TOPIC_BANK: Array<{ topic: string; family: ContentFamily }> = [
  { topic: "Avoiding inspection pitfalls before you waive conditions", family: "mistake_prevention" },
  { topic: "What a smart offer structure looks like in Quebec", family: "deal_education" },
  { topic: "Reading seller declarations: red flags vs noise", family: "legal_negotiation_explainer" },
  { topic: "How LECIPM keeps your negotiation chain auditable", family: "product_demo" },
  { topic: "Waiving financing vs. firm offer: a side-by-side", family: "comparison" },
  { topic: "How one buyer avoided a six-figure mistake", family: "case_story" },
];

function hashDay(planDate: string): number {
  let h = 0;
  for (let i = 0; i < planDate.length; i++) h = (h * 31 + planDate.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function selectDailyTopic(args: { planDate: string; focus?: string }): { topic: string; family: ContentFamily } {
  if (args.focus?.trim()) {
    return { topic: args.focus.trim(), family: "deal_education" };
  }
  const idx = hashDay(args.planDate) % TOPIC_BANK.length;
  return TOPIC_BANK[idx]!;
}
