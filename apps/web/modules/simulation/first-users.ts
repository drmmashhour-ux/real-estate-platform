/**
 * Deterministic first-10 user simulation — models hesitation & drop-offs (not live traffic).
 * Does NOT write to DB. Use to train QA focus; validate with real `growth_events` later.
 */

export type FunnelEvent =
  | "ad_click"
  | "landing_view"
  | "listing_view"
  | "booking_start"
  | "checkout"
  | "booking_completed";

export type SimulationStep = {
  step: FunnelEvent | "auth_prompt" | "price_review" | "form_error" | "payment_abandon";
  outcome: "ok" | "hesitate" | "drop";
  detail?: string;
};

export type UserPersonaId =
  | "curious_browser"
  | "price_sensitive"
  | "ready_to_book"
  | "confused_user"
  | "returning_user"
  | "mobile_user"
  | "student_renter"
  | "investor"
  | "host_exploring"
  | "drop_off_user";

export type UserSimulation = {
  userId: string;
  persona: UserPersonaId;
  personaLabel: string;
  steps: SimulationStep[];
  conversion: boolean;
  /** Product friction — honest UX risks. */
  friction: string[];
  dropOffReason: string | null;
};

export type FirstUsersSimulationAggregate = {
  totalUsers: number;
  conversions: number;
  conversionRate: number;
  funnel: {
    step: FunnelEvent;
    reached: number;
    rateFromPrevious: number | null;
  }[];
  dropOffPoints: { step: string; count: number }[];
  frictionPoints: { label: string; count: number }[];
  revenueEstimateCad: number;
};

function countReached(users: UserSimulation[], predicate: (s: SimulationStep[]) => boolean): number {
  return users.filter((u) => predicate(u.steps)).length;
}

function hasEvent(steps: SimulationStep[], e: SimulationStep["step"]): boolean {
  return steps.some((s) => s.step === e && s.outcome !== "drop");
}

function funnelRates(users: UserSimulation[]): FirstUsersSimulationAggregate["funnel"] {
  const ad = countReached(users, (st) => st.some((x) => x.step === "ad_click"));
  const lp = countReached(users, (st) => st.some((x) => x.step === "landing_view"));
  const lv = users.filter((u) => hasEvent(u.steps, "listing_view")).length;
  const bs = users.filter((u) => hasEvent(u.steps, "booking_start")).length;
  const co = users.filter((u) => hasEvent(u.steps, "checkout")).length;
  const bc = users.filter((u) => hasEvent(u.steps, "booking_completed")).length;

  const seq = [
    { step: "ad_click" as const, reached: ad },
    { step: "landing_view" as const, reached: lp },
    { step: "listing_view" as const, reached: lv },
    { step: "booking_start" as const, reached: bs },
    { step: "checkout" as const, reached: co },
    { step: "booking_completed" as const, reached: bc },
  ];

  return seq.map((row, i) => {
    const prev = i > 0 ? seq[i - 1]!.reached : null;
    const rateFromPrevious =
      prev != null && prev > 0 ? Math.round((row.reached / prev) * 1000) / 1000 : null;
    return { step: row.step, reached: row.reached, rateFromPrevious };
  });
}

function aggregateFriction(users: UserSimulation[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const u of users) {
    for (const f of u.friction) {
      map.set(f, (map.get(f) ?? 0) + 1);
    }
  }
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function aggregateDropoffs(users: UserSimulation[]): { step: string; count: number }[] {
  const map = new Map<string, number>();
  for (const u of users) {
    if (!u.conversion && u.dropOffReason) {
      map.set(u.dropOffReason, (map.get(u.dropOffReason) ?? 0) + 1);
    }
  }
  return [...map.entries()].map(([step, count]) => ({ step, count }));
}

/**
 * Ten scripted personas — conservative booking success (2/10) to reflect cold + confused traffic.
 */
export function simulateFirstTenUsers(): { users: UserSimulation[]; aggregate: FirstUsersSimulationAggregate } {
  const users: UserSimulation[] = [
    {
      userId: "sim-01",
      persona: "curious_browser",
      personaLabel: "Curious browser",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "ok" },
        { step: "listing_view", outcome: "hesitate", detail: "bounces after hero" },
      ],
      conversion: false,
      friction: ["Weak motivation — needs social proof above fold"],
      dropOffReason: "listing_view",
    },
    {
      userId: "sim-02",
      persona: "price_sensitive",
      personaLabel: "Price-sensitive guest",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "ok" },
        { step: "listing_view", outcome: "ok" },
        { step: "price_review", outcome: "hesitate", detail: "fees + taxes feel high vs OTA memory" },
        { step: "booking_start", outcome: "drop" },
      ],
      conversion: false,
      friction: ["All-in price clarity before dates", "Fee breakdown earlier"],
      dropOffReason: "booking_start",
    },
    {
      userId: "sim-03",
      persona: "ready_to_book",
      personaLabel: "Ready-to-book guest",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "ok" },
        { step: "listing_view", outcome: "ok" },
        { step: "booking_start", outcome: "ok" },
        { step: "checkout", outcome: "ok" },
        { step: "booking_completed", outcome: "ok" },
      ],
      conversion: true,
      friction: ["Minor: date picker focus order"],
      dropOffReason: null,
    },
    {
      userId: "sim-04",
      persona: "confused_user",
      personaLabel: "Confused user",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "ok" },
        { step: "listing_view", outcome: "ok" },
        { step: "form_error", outcome: "drop", detail: "guest count validation unclear" },
      ],
      conversion: false,
      friction: ["Form labels + inline validation copy", "Guest count defaults"],
      dropOffReason: "booking_start",
    },
    {
      userId: "sim-05",
      persona: "returning_user",
      personaLabel: "Returning user",
      steps: [
        { step: "ad_click", outcome: "ok", detail: "remarketing ad" },
        { step: "landing_view", outcome: "ok", detail: "direct + UTM recall" },
        { step: "listing_view", outcome: "ok" },
        { step: "booking_start", outcome: "ok" },
        { step: "checkout", outcome: "ok" },
        { step: "booking_completed", outcome: "ok" },
      ],
      conversion: true,
      friction: ["Ensure saved searches / wishlist visible on return"],
      dropOffReason: null,
    },
    {
      userId: "sim-06",
      persona: "mobile_user",
      personaLabel: "Impatient mobile user",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "ok" },
        { step: "listing_view", outcome: "ok" },
        { step: "checkout", outcome: "hesitate", detail: "Stripe sheet feels slow on 4G" },
        { step: "payment_abandon", outcome: "drop" },
      ],
      conversion: false,
      friction: ["Checkout perf + skeleton states", "Apple/Google Pay if available"],
      dropOffReason: "checkout",
    },
    {
      userId: "sim-07",
      persona: "student_renter",
      personaLabel: "Student renter",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "ok" },
        { step: "listing_view", outcome: "ok" },
        { step: "price_review", outcome: "drop", detail: "nightly rate vs budget" },
      ],
      conversion: false,
      friction: ["Filters for budget cap", "weekly/monthly lens where relevant"],
      dropOffReason: "listing_view",
    },
    {
      userId: "sim-08",
      persona: "investor",
      personaLabel: "Investor (wrong funnel)",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "hesitate", detail: "expects /lp/invest not /lp/rent" },
      ],
      conversion: false,
      friction: ["Campaign/keyword → LP match; route investors to /lp/invest"],
      dropOffReason: "landing_view",
    },
    {
      userId: "sim-09",
      persona: "host_exploring",
      personaLabel: "Host exploring (not a guest booking)",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "ok", detail: "lands on /lp/host from host ad" },
        { step: "auth_prompt", outcome: "ok", detail: "signup for host" },
      ],
      conversion: false,
      friction: ["Separate host vs guest KPI — do not count as BNHub guest revenue"],
      dropOffReason: "booking_start",
    },
    {
      userId: "sim-10",
      persona: "drop_off_user",
      personaLabel: "Hard drop-off at payment",
      steps: [
        { step: "ad_click", outcome: "ok" },
        { step: "landing_view", outcome: "ok" },
        { step: "listing_view", outcome: "ok" },
        { step: "booking_start", outcome: "ok" },
        { step: "checkout", outcome: "ok" },
        { step: "payment_abandon", outcome: "drop", detail: "second thoughts / card trust" },
      ],
      conversion: false,
      friction: ["Trust badges near pay", "clear refund/house rules link pre-pay"],
      dropOffReason: "checkout",
    },
  ];

  const conversions = users.filter((u) => u.conversion).length;
  const conversionRate = users.length ? Math.round((conversions / users.length) * 1000) / 1000 : 0;
  const funnel = funnelRates(users);
  const dropOffPoints = aggregateDropoffs(users);
  const frictionPoints = aggregateFriction(users);
  const avgStayCad = 185;
  const takeRate = 0.12;
  const revenueEstimateCad = Math.round(conversions * avgStayCad * takeRate * 100) / 100;

  return {
    users,
    aggregate: {
      totalUsers: users.length,
      conversions,
      conversionRate,
      funnel,
      dropOffPoints,
      frictionPoints,
      revenueEstimateCad,
    },
  };
}
