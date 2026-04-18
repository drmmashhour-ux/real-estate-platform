import type { ExecutionDay, ExecutionPlan } from "./deal-execution-plan.types";

function slugCity(city: string): string {
  return city.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "") || "city";
}

/**
 * Deterministic 7-day sprint content for operators. No outbound automation.
 */
export function build7DayDealPlan(city: string): ExecutionPlan {
  const c = city.trim() || "your city";
  void c; // reserved for future day copy personalization
  const days: ExecutionDay[] = [
    {
      day: 1,
      title: "Broker outreach",
      tasks: [
        "Contact 20 brokers (Instagram / LinkedIn)",
        "Track responses",
        "Goal: 3–5 interested brokers",
      ],
    },
    {
      day: 2,
      title: "Continue outreach + prepare ads",
      tasks: [
        "Contact 20 more brokers",
        "Prepare ads copy",
        "Goal: 5–8 total brokers",
      ],
    },
    {
      day: 3,
      title: "Launch ads ($10–$15)",
      tasks: [
        "Run 1 Facebook campaign",
        "Target city buyers",
        "Goal: first leads",
      ],
    },
    {
      day: 4,
      title: "Optimize + follow-up",
      tasks: [
        "Follow up brokers",
        "Respond to leads fast",
        "Goal: first qualified leads",
      ],
    },
    {
      day: 5,
      title: "Push conversion",
      tasks: [
        "Schedule calls / showings",
        "Match leads to brokers",
        "Goal: serious prospects",
      ],
    },
    {
      day: 6,
      title: "Close opportunity",
      tasks: [
        "Ensure broker follow-up",
        "Push offer discussions",
        "Goal: first deal in progress",
      ],
    },
    {
      day: 7,
      title: "Analyze + scale",
      tasks: [
        "Identify what worked",
        "Increase ads budget",
        "Lock 3–5 active brokers",
      ],
    },
  ];

  return {
    id: `7-day-deal-v1-${slugCity(city)}`,
    days,
    createdAt: new Date().toISOString(),
  };
}
