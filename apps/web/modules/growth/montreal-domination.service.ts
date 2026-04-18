export type MontrealDominationPlan = {
  city: "Montréal";
  weeks: {
    week: number;
    actions: string[];
  }[];
};

/**
 * 30-day Montréal execution plan — human steps only; no auto-spend or auto-messaging.
 */
export function buildMontrealDominationPlan(): MontrealDominationPlan {
  return {
    city: "Montréal",
    weeks: [
      {
        week: 1,
        actions: ["Contact 100 brokers", "Onboard 10–15 active brokers", "Launch ads"],
      },
      {
        week: 2,
        actions: ["Generate leads daily", "Improve conversion", "Push first deals"],
      },
      {
        week: 3,
        actions: ["Scale ads", "Increase pricing", "Prioritize best brokers"],
      },
      {
        week: 4,
        actions: ["Dominate supply (brokers)", "Dominate demand (leads)", "Maximize deals"],
      },
    ],
  };
}
