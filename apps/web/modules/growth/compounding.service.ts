import type { CompoundingPlan } from "./compounding.types";

/**
 * Post-close habits to turn one success into pipeline — manual execution; measure in CRM.
 */
export function buildCompoundingPlan(): CompoundingPlan {
  return {
    actions: [
      {
        title: "ACTION 1 — REFERRALS",
        actions: ["Ask broker for 2–3 referrals", "Ask client for referrals"],
      },
      {
        title: "ACTION 2 — TESTIMONIALS",
        actions: ["Collect success story", "Use in marketing"],
      },
      {
        title: "ACTION 3 — BROKER EXPANSION",
        actions: ["Recruit similar brokers"],
      },
      {
        title: "ACTION 4 — SCALE ADS",
        actions: ["Increase budget on winning ads"],
      },
      {
        title: "ACTION 5 — OPTIMIZE FUNNEL",
        actions: ["Improve follow-up speed", "Reduce drop-offs"],
      },
    ],
  };
}
