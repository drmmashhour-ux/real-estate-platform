import type { ScalingBlueprint, ScalingDay } from "./scaling-blueprint.types";

function slugCity(city: string): string {
  return city.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "") || "city";
}

/**
 * 14-day human execution blueprint. No automated spend or sends.
 */
export function build14DayScalingBlueprint(city: string): ScalingBlueprint {
  void city;
  const days: ScalingDay[] = [
    {
      day: 1,
      focus: "DAY 1–2",
      actions: ["Contact 40 brokers", "Secure 5–10 active brokers"],
    },
    {
      day: 3,
      focus: "DAY 3–4",
      actions: ["Launch ads ($10–$20/day)", "Capture leads"],
    },
    {
      day: 5,
      focus: "DAY 5–6",
      actions: ["Follow up instantly", "Route leads efficiently"],
    },
    {
      day: 7,
      focus: "DAY 7–8",
      actions: ["Push showings", "Focus on serious buyers"],
    },
    {
      day: 9,
      focus: "DAY 9–10",
      actions: ["Increase ad spend", "Double lead flow"],
    },
    {
      day: 11,
      focus: "DAY 11–12",
      actions: ["Focus on closing", "Push offers"],
    },
    {
      day: 13,
      focus: "DAY 13–14",
      actions: ["Analyze winners", "Scale what works"],
    },
  ];

  return {
    id: `scaling-blueprint-14-v1-${slugCity(city)}`,
    days,
  };
}
