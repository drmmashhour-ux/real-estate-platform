import type { Deal } from "@prisma/client";

/** Lightweight heuristics for dashboard risk strip — full analysis remains in contract intelligence. */
export function residentialRiskPromptsForDeal(deal: Deal): string[] {
  const prompts: string[] = [];
  const meta = deal.executionMetadata && typeof deal.executionMetadata === "object" ? (deal.executionMetadata as Record<string, unknown>) : {};
  if (!meta.possessionDate) prompts.push("Possession / occupancy date not captured in execution metadata.");
  if (!deal.assignedFormPackageKey) prompts.push("Form package not assigned — confirm required official forms.");
  if (deal.status === "financing" || deal.status === "inspection") {
    prompts.push(`Deal status ${deal.status} — confirm deadlines and conditions in brokerage file.`);
  }
  return prompts;
}
