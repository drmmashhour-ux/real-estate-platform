export type BookingAccelerationDay = {
  day: number;
  title: string;
  bullets: string[];
};

export type BookingAccelerationPhase = {
  /** Mission-aligned grouping. */
  id: "1-2" | "3-4" | "5-6" | "7";
  title: string;
  bullets: string[];
};

export type SevenDayBookingPlan = {
  /** ISO start of “day 1” in ops calendar (local interpretation left to the team). */
  generatedAt: string;
  days: BookingAccelerationDay[];
  /** Grouped playbook (days 1–2, 3–4, 5–6, 7). */
  phases: BookingAccelerationPhase[];
  summary: string;
  currentStageHint: string;
};

/**
 * 7-day playbook for paid + retargeting + on-site urgency — planning only (no automation).
 */
export function build7DayBookingPlan(now = new Date()): SevenDayBookingPlan {
  const generatedAt = now.toISOString();
  const days: BookingAccelerationDay[] = [
    {
      day: 1,
      title: "Launch & measure",
      bullets: [
        "Launch Meta/Google to `/ads/*` landings with UTMs — start at the budget in `getInitialBudgetPlan()`.",
        "Confirm `growth_events` receives landing_view, listing_view, booking_started.",
        "Tag top BNHub listings by CTR from internal search winners (featured + boost hooks).",
      ],
    },
    {
      day: 2,
      title: "Traffic & inventory",
      bullets: [
        "Collect traffic; fix broken destinations from ads to listing detail.",
        "Identify top 5 listings by views + saves (listing analytics).",
        "Turn on retargeting plan for high-intent viewers (see Retargeting Engine).",
      ],
    },
    {
      day: 3,
      title: "Retarget warm users",
      bullets: [
        "Deploy retargeting audiences: engaged + highIntent from `buildRetargetingAudiences`.",
        "Improve property pages: verified badge, urgency strip (real analytics only).",
        "A/B one headline on hero LP — no pricing guarantees.",
      ],
    },
    {
      day: 4,
      title: "Depth & trust",
      bullets: [
        "Push hot leads with CRM templates — booking_completed still missing.",
        "Review abandoned bookings count — urgency creative for checkout recovery.",
        "Audit Stripe checkout drop-off vs funnel analysis bottleneck.",
      ],
    },
    {
      day: 5,
      title: "Scale winners",
      bullets: [
        "Increase budget on ad sets with CTR >2% and cost/lead under target.",
        "Pause creatives under 1% CTR after meaningful impressions.",
        "Feature best listings in homepage rails + BNHub collections.",
      ],
    },
    {
      day: 6,
      title: "Urgency & social proof",
      bullets: [
        "Add limited availability messaging where data supports it (BNHub availability engine).",
        "Highlight early access pricing only when policy-true.",
        "Retarget abandoned bookings with 24h countdown style copy (honest cutoffs only).",
      ],
    },
    {
      day: 7,
      title: "Conversion max",
      bullets: [
        "Maximize bookings: bid on proven keywords + narrow placements.",
        "Surface best listings first (featured + boost ranking hooks).",
        "Review funnel bottleneck from `analyzeBookingFunnel` and schedule next week’s tests.",
      ],
    },
  ];

  const dow = now.getUTCDay();
  const currentStageHint =
    dow === 0 || dow === 6
      ? "Weekend — prioritize mobile landing QA and short video creatives."
      : "Weekday — push search + retargeting during evening commute windows (Montreal).";

  const phases: BookingAccelerationPhase[] = [
    {
      id: "1-2",
      title: "Days 1–2 — Launch ads · collect traffic · top listings",
      bullets: [...days[0]!.bullets, ...days[1]!.bullets],
    },
    {
      id: "3-4",
      title: "Days 3–4 — Retarget · improve property pages",
      bullets: [...days[2]!.bullets, ...days[3]!.bullets],
    },
    {
      id: "5-6",
      title: "Days 5–6 — Scale winners · urgency",
      bullets: [...days[4]!.bullets, ...days[5]!.bullets],
    },
    {
      id: "7",
      title: "Day 7 — Maximize conversions",
      bullets: days[6]!.bullets,
    },
  ];

  const summary =
    "Seven-day sprint: capture warm demand, retarget engaged visitors, scale proven creatives, and tighten checkout trust — all actions are manual; no auto-spend or Stripe changes.";

  return { generatedAt, days, phases, summary, currentStageHint };
}

/** Monday = day 1 … Sunday = day 7 (UTC). */
export function getSprintDayIndex1To7(now = new Date()): number {
  const d = now.getUTCDay();
  return d === 0 ? 7 : d;
}

export function getActionsForCalendarDay(now = new Date()): BookingAccelerationDay {
  const plan = build7DayBookingPlan(now);
  const idx = Math.min(6, Math.max(0, getSprintDayIndex1To7(now) - 1));
  return plan.days[idx]!;
}

/** Maps calendar week to the 7-day sprint playbook (ops rhythm, not persisted). */
export function getCurrentAccelerationStage(now = new Date()): {
  rangeLabel: string;
  bullets: string[];
  hint: string;
} {
  const plan = build7DayBookingPlan(now);
  const dow = now.getUTCDay();
  let indices: number[] = [];
  let rangeLabel = "";
  if (dow >= 1 && dow <= 2) {
    indices = [0, 1];
    rangeLabel = "Days 1–2";
  } else if (dow >= 3 && dow <= 4) {
    indices = [2, 3];
    rangeLabel = "Days 3–4";
  } else if (dow >= 5 && dow <= 6) {
    indices = [4, 5];
    rangeLabel = "Days 5–6";
  } else {
    indices = [6];
    rangeLabel = "Day 7";
  }
  const bullets = indices.flatMap((i) => plan.days[i]?.bullets ?? []);
  return { rangeLabel, bullets, hint: plan.currentStageHint };
}
