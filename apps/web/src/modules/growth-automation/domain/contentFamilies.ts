import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";

export const CONTENT_FAMILIES: { id: ContentFamily; label: string }[] = [
  { id: "mistake_prevention", label: "Mistake prevention" },
  { id: "deal_education", label: "Deal education" },
  { id: "legal_negotiation_explainer", label: "Legal / negotiation explainer" },
  { id: "product_demo", label: "Product demo" },
  { id: "comparison", label: "Comparison (bad vs smart decision)" },
  { id: "case_story", label: "Case story" },
];

export function isContentFamily(s: string): s is ContentFamily {
  return CONTENT_FAMILIES.some((f) => f.id === s);
}
