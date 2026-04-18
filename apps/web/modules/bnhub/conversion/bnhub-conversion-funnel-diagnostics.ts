import type {
  BNHubConversionInsight,
  BNHubConversionMetrics,
  BnhubWeakestFunnelStep,
} from "./bnhub-guest-conversion.types";

const loss = (rate: number) => 1 - Math.min(1, Math.max(0, rate));

type ListingHint = {
  photoCount: number;
  descriptionLen: number;
  nightPriceCents: number;
};

export type WeakestStepDiagnostics = {
  step: BnhubWeakestFunnelStep;
  label: string | null;
  /** Fraction of users lost at this transition (0–1), same criterion used to rank weakest step. */
  dropOffRate: number | null;
};

/**
 * Picks the funnel step with the largest *drop* (1 - step conversion), with volume guards.
 */
export function computeWeakestStep(m: BNHubConversionMetrics): WeakestStepDiagnostics {
  const stages: { key: BnhubWeakestFunnelStep; l: number; w: number }[] = [
    { key: "search_click", l: m.impressions >= 20 ? loss(m.ctr) : 0, w: m.impressions },
    { key: "click_view", l: m.clicks >= 8 ? loss(m.viewRate) : 0, w: m.clicks },
    { key: "view_start", l: m.views >= 10 ? loss(m.viewToStartRate) : 0, w: m.views },
    { key: "start_paid", l: m.bookingStarts >= 3 ? loss(m.startToPaidRate) : 0, w: m.bookingStarts },
  ];
  const ranked = stages.filter((s) => s.l > 0).sort((a, b) => b.l - a.l);
  if (ranked.length === 0) return { step: null, label: null, dropOffRate: null };
  const top = ranked[0]!;
  const labels: Record<NonNullable<BnhubWeakestFunnelStep>, string> = {
    search_click: "Search → click (discovery)",
    click_view: "Click → listing view",
    view_start: "Listing view → booking start",
    start_paid: "Booking start → paid completion",
  };
  return {
    step: top.key,
    label: top.key != null ? labels[top.key] : null,
    dropOffRate: top.l,
  };
}

/** Short listing-level label for hosts — derived from tracked metrics + analyzer output (no fabricated numbers). */
export function buildConversionIssueLabel(
  step: BnhubWeakestFunnelStep,
  insight: BNHubConversionInsight | null,
): string | null {
  if (insight?.title?.trim()) return insight.title.trim();
  switch (step) {
    case "search_click":
      return "Low discovery click-through";
    case "click_view":
      return "Clicks not converting to listing views";
    case "view_start":
      return "Low booking start rate";
    case "start_paid":
      return "Users drop off before completing payment";
    default:
      return null;
  }
}

const STEP_TO_INSIGHT: Record<Exclude<BnhubWeakestFunnelStep, null>, BNHubConversionInsight["type"]> = {
  search_click: "low_ctr",
  click_view: "low_view_rate",
  view_start: "low_booking_start_rate",
  start_paid: "friction_detected",
};

export function pickBiggestIssue(
  metrics: BNHubConversionMetrics,
  insights: BNHubConversionInsight[],
): BNHubConversionInsight | null {
  if (insights.length === 0) return null;
  const sev = (s: BNHubConversionInsight["severity"]) => (s === "high" ? 3 : s === "medium" ? 2 : 1);
  const { step } = computeWeakestStep(metrics);
  if (step) {
    const want = STEP_TO_INSIGHT[step];
    const match = insights.find((i) => i.type === want);
    if (match) return match;
  }
  const friction = insights
    .filter((i) => i.type === "friction_detected")
    .sort((a, b) => sev(b.severity) - sev(a.severity))[0];
  if (friction && sev(friction.severity) >= 2) return friction;
  const ranked = [...insights]
    .filter((i) => i.type !== "strong_performance")
    .sort((a, b) => sev(b.severity) - sev(a.severity));
  return ranked[0] ?? null;
}

/** One-line host directive from weakest funnel stage (rule-based). */
export function hostActionLineForWeakest(step: BnhubWeakestFunnelStep): string {
  switch (step) {
    case "search_click":
      return "Improve lead photo & title — discovery is losing guests before they click.";
    case "click_view":
      return "Align search thumbnail with hero & location — clicks aren’t landing as listing views.";
    case "view_start":
      return "Add trust + clearer total price — guests view but don’t start booking.";
    case "start_paid":
      return "Reduce checkout surprise — many starts, few paid completions.";
    default:
      return "Keep photos, pricing, and calendar updated and monitor weekly.";
  }
}

/**
 * Guest listing boost: reassurance after high starts/low pay vs social proof when views don’t convert to starts.
 */
export function conversionBoostFrictionMode(
  metrics: BNHubConversionMetrics | null,
  trackingAligned: boolean,
): "reassurance" | "social_proof" | "default" {
  if (!metrics || !trackingAligned) return "default";
  const { views, bookingStarts, viewToStartRate, startToPaidRate } = metrics;
  if (views >= 12 && viewToStartRate < 0.045) return "social_proof";
  if (bookingStarts >= 3 && startToPaidRate < 0.28) return "reassurance";
  return "default";
}

export function buildBnhubAlerts(
  metrics: BNHubConversionMetrics,
  insights: BNHubConversionInsight[],
): { code: string; message: string; severity: "warn" | "critical" }[] {
  const out: { code: string; message: string; severity: "warn" | "critical" }[] = [];
  const dropAfterStart =
    metrics.views >= 15 &&
    metrics.bookingStarts >= 5 &&
    metrics.startToPaidRate < 0.22;

  if (dropAfterStart) {
    out.push({
      code: "high_drop_after_start",
      severity: "critical",
      message:
        "High drop-off after booking start vs paid completion — reinforce total before checkout and verify host payout readiness.",
    });
  }

  if (metrics.views >= 45 && metrics.bookingsCompleted === 0 && metrics.bookingStarts === 0) {
    out.push({
      code: "views_no_bookings",
      severity: "warn",
      message: "High listing views but zero booking attempts — improve hero photos, title, and upfront total price.",
    });
  }

  const frictionHigh = insights.some((i) => i.type === "friction_detected" && i.severity === "high");
  if (frictionHigh && !dropAfterStart) {
    out.push({
      code: "friction_pattern",
      severity: "critical",
      message: "Friction pattern in funnel signals — walk the guest path through confirm and payment.",
    });
  }
  return out;
}

export function buildBnhubQuickWins(
  metrics: BNHubConversionMetrics,
  insights: BNHubConversionInsight[],
  hints: ListingHint | null,
): string[] {
  const out: string[] = [];
  const push = (s: string) => {
    if (out.length >= 5) return;
    if (!out.includes(s)) out.push(s);
  };

  const weak = computeWeakestStep(metrics);

  if (weak.step === "search_click" || insights.some((i) => i.type === "low_ctr")) {
    push("Lead with a brighter cover photo and a title that matches how guests search this city.");
  }
  if (weak.step === "click_view" || insights.some((i) => i.type === "low_view_rate")) {
    push("Align the search card thumbnail with the hero image so clicks land with confidence.");
  }
  if (weak.step === "view_start" || insights.some((i) => i.type === "low_booking_start_rate")) {
    push("Surface total price earlier: confirm cleaning fee and min nights are obvious above the fold.");
  }
  if (weak.step === "start_paid" || insights.some((i) => i.type === "friction_detected")) {
    push("Reduce surprise at checkout: remind guests the total includes taxes/service fee before Stripe.");
  }

  if (hints) {
    if (hints.photoCount < 5) push(`Add photos (you show ${hints.photoCount}; aim for at least 8–12 for trust).`);
    if (hints.descriptionLen < 280) push("Expand the description with amenities, parking, and check-in clarity.");
    if (hints.nightPriceCents > 0 && metrics.views >= 25 && metrics.bookingStarts === 0) {
      push("Test a modest nightly adjustment if comparable stays are materially lower in your market.");
    }
  }

  if (out.length === 0) push("Keep calendar updated and respond quickly — speed lifts booking completion.");
  return out.slice(0, 5);
}
