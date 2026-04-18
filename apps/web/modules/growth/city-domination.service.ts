import type { CityDominationDay, CityDominationPlan } from "./city-domination.types";

/**
 * 30-day human-run city plan (weekly milestones). No auto-spend or auto-send.
 */
export function build30DayDominationPlan(city: string): CityDominationPlan {
  const c = city.trim() || "your city";
  const days: CityDominationDay[] = [
    {
      day: 1,
      focus: "WEEK 1",
      actions: ["onboard 20 brokers", "launch ads", "capture leads"],
    },
    {
      day: 8,
      focus: "WEEK 2",
      actions: ["optimize funnel", "increase conversion", "push deals"],
    },
    {
      day: 15,
      focus: "WEEK 3",
      actions: ["scale ads", "increase pricing", "prioritize elite brokers"],
    },
    {
      day: 22,
      focus: "WEEK 4",
      actions: ["dominate supply + demand", "lock top brokers", "maximize revenue"],
    },
  ];

  return { city: c, days };
}
