/**
 * Deterministic daily action list for operators (no external API).
 */

export type DailyActionBundle = {
  date: string;
  actions: string[];
  priority: "p0" | "p1" | "p2";
};

const ROTATING = [
  "Post in one Montreal housing FB group with UTM-tagged /lp/rent link.",
  "Message 3 hosts who viewed /lp/host but did not list — offer setup help.",
  "Review Admin → Growth launch: retargeting segment sizes vs last week.",
  "Run budget simulator at $750; compare expected vs actual signup_success count.",
  "Check Stripe webhook logs for booking_completed vs growth_events booking_completed.",
  "Export montreal-presets headlines; rotate lowest-CTR creative in Ads.",
  "Add one broker intro from warm list; log outcome in CRM.",
] as const;

export function generateDailyLaunchActions(date = new Date(), city = "Montreal"): DailyActionBundle {
  const iso = date.toISOString().slice(0, 10);
  const day = date.getUTCDate();
  const idx = day % ROTATING.length;

  const actions: string[] = [
    `[${city}] Review yesterday's signup_success vs ad spend (Admin Analytics).`,
    ROTATING[idx]!,
    "Scan booking_started without booking_completed (last 48h) — nudge abandoned checkout.",
  ];

  return {
    date: iso,
    actions,
    priority: day % 7 === 1 ? "p0" : "p1",
  };
}
