import type { LecipmAutopilotDomainId } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";

/** Executive-facing domain buckets (maps to underlying autopilot domains). */
export type AutonomyUiDomainId =
  | "marketing"
  | "sales_ai"
  | "booking"
  | "no_show"
  | "post_visit"
  | "deal_intelligence"
  | "investment_allocator"
  | "marketplace"
  | "compliance";

export type UiDomainDefinition = {
  id: AutonomyUiDomainId;
  title: string;
  /** Underlying technical domains aggregated for this row. */
  domainIds: readonly LecipmAutopilotDomainId[];
};

export const AUTONOMY_UI_DOMAIN_GROUPS: readonly UiDomainDefinition[] = [
  {
    id: "marketing",
    title: "Marketing",
    domainIds: ["marketing_content_generation", "marketing_scheduling", "marketing_publishing"],
  },
  {
    id: "sales_ai",
    title: "Sales / AI Agent",
    domainIds: ["lead_routing", "ai_followup_sequences", "broker_assistant_actions"],
  },
  { id: "booking", title: "Booking", domainIds: ["booking_slot_suggestion"] },
  { id: "no_show", title: "No-show prevention", domainIds: ["no_show_reminders"] },
  { id: "post_visit", title: "Post-visit", domainIds: ["post_visit_followups"] },
  {
    id: "deal_intelligence",
    title: "Deal intelligence",
    domainIds: ["deal_intelligence_guided_actions"],
  },
  {
    id: "investment_allocator",
    title: "Investment / allocator",
    domainIds: ["capital_allocator_recommendations", "investment_actions"],
  },
  {
    id: "marketplace",
    title: "Marketplace optimization",
    domainIds: ["marketplace_optimization_proposals", "pricing"],
  },
  { id: "compliance", title: "Compliance", domainIds: ["compliance_actions"] },
] as const;

export function uiGroupForTechnicalDomain(domain: string): AutonomyUiDomainId | null {
  for (const g of AUTONOMY_UI_DOMAIN_GROUPS) {
    if ((g.domainIds as readonly string[]).includes(domain)) return g.id;
  }
  return null;
}
