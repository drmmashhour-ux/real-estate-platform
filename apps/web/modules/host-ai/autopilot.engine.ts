/**
 * Host autopilot decision intelligence — explainable proposals only; execution stays in governed pipelines.
 */
import type { HostAutopilotConfig } from "@/lib/ai/autopilot/host-config";
import {
  executionPathForListingCopy,
  executionPathForPricing,
  ruleNeverAutoAcceptBookings,
  ruleRespectsHostPreferences,
} from "./autopilot-rules";

export type AutopilotMode = HostAutopilotConfig["autopilotMode"];

export type AutopilotRiskLevel = "low" | "medium" | "high";

export type AutopilotActionKind =
  | "pricing_adjustment"
  | "message_draft"
  | "booking_recommendation"
  | "listing_improvement";

export type AutopilotActionProposal = {
  id: string;
  kind: AutopilotActionKind;
  title: string;
  explanation: string;
  /** 0–1 calibrated for display */
  confidence: number;
  risk: AutopilotRiskLevel;
  /** What the product would do next if you agree */
  executionHint: "suggest_only" | "queue_approval" | "auto_apply_listing_copy" | "manual_only";
  target?: { entityType: string; entityId: string };
  metadata?: Record<string, unknown>;
};

export type AutopilotEvaluationResult = {
  actions: AutopilotActionProposal[];
  overallConfidence: number;
  riskLevel: AutopilotRiskLevel;
  summary: string;
  rulesApplied: string[];
};

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function maxRisk(a: AutopilotRiskLevel, b: AutopilotRiskLevel): AutopilotRiskLevel {
  const o = { low: 0, medium: 1, high: 2 };
  return o[a] >= o[b] ? a : b;
}

export type EvaluateAutopilotContext = {
  config: HostAutopilotConfig;
  listings: Array<{
    id: string;
    title: string;
    city: string;
    nightPriceCents: number;
    photos?: unknown;
    description?: string | null;
  }>;
  bookingsAwaitingApproval: Array<{
    id: string;
    listingId: string;
    listingTitle: string;
    createdAt: Date;
    totalCents: number;
  }>;
};

/**
 * Read-only evaluation for dashboards — does not write to DB or change prices.
 */
export function evaluateAutopilotActions(context: EvaluateAutopilotContext): AutopilotEvaluationResult {
  const rulesApplied: string[] = [];
  const actions: AutopilotActionProposal[] = [];
  const { config: cfg } = context;

  if (!cfg.autopilotEnabled || cfg.autopilotMode === "OFF") {
    return {
      actions: [],
      overallConfidence: 0,
      riskLevel: "low",
      summary: "Autopilot is off. Turn it on in settings to see guided actions.",
      rulesApplied: ["autopilot_disabled"],
    };
  }

  const prices = context.listings.map((l) => l.nightPriceCents).filter((c) => c > 0);
  const med = median(prices);

  const listingPath = executionPathForListingCopy(cfg.autopilotMode);
  const pricingPath = executionPathForPricing(cfg.autopilotMode);

  // Listing improvements
  const optPref = ruleRespectsHostPreferences(cfg, "autoListingOptimization");
  rulesApplied.push("listing_optimization_preference");
  if (optPref.allowed && listingPath !== "blocked") {
    for (const l of context.listings) {
      const pc = Array.isArray(l.photos) ? l.photos.filter((x): x is string => typeof x === "string").length : 0;
      const thin = (l.description?.length ?? 0) < 120;
      if (pc < 3 || thin) {
        const exec: AutopilotActionProposal["executionHint"] =
          listingPath === "auto_safe" ? "auto_apply_listing_copy" : listingPath === "needs_approval" ? "queue_approval" : "suggest_only";
        actions.push({
          id: `listing_improvement:${l.id}`,
          kind: "listing_improvement",
          title: thin ? "Expand listing description" : "Add more photos",
          explanation:
            thin && pc < 3
              ? "Short description and fewer than three photos usually reduce conversion. Autopilot can suggest copy and SEO keywords; applying follows your mode (assist vs safe vs approval)."
              : thin
                ? "Description is very short — guests may skip your listing."
                : "Listings with more photos tend to earn more trust and bookings.",
          confidence: 0.72,
          risk: "low",
          executionHint: exec,
          target: { entityType: "short_term_listing", entityId: l.id },
          metadata: { photoCount: pc, descriptionChars: l.description?.length ?? 0 },
        });
        break;
      }
    }
  }

  // Pricing advisory
  const pricePref = ruleRespectsHostPreferences(cfg, "autoPricing");
  rulesApplied.push("pricing_preference");
  if (pricePref.allowed && med != null && pricingPath !== "blocked") {
    for (const l of context.listings) {
      if (l.nightPriceCents <= 0) continue;
      const ratio = l.nightPriceCents / med;
      if (ratio < 0.88) {
        const suggestedCents = Math.round(l.nightPriceCents * 1.03);
        actions.push({
          id: `pricing_nudge:${l.id}`,
          kind: "pricing_adjustment",
          title: "Consider a small nightly price increase",
          explanation: `Your nightly rate is below the typical band for your active listings (~${(ratio * 100).toFixed(0)}% of median). A ~3% test increase is a common starting point; autopilot never changes price without your confirmation or approval flow.`,
          confidence: 0.58,
          risk: "medium",
          executionHint: pricingPath === "needs_approval" ? "queue_approval" : "suggest_only",
          target: { entityType: "short_term_listing", entityId: l.id },
          metadata: { currentCents: l.nightPriceCents, suggestedCents, medianCents: med },
        });
        break;
      }
    }
  }

  // Message drafts
  const msgPref = ruleRespectsHostPreferences(cfg, "autoMessaging");
  rulesApplied.push("messaging_preference");
  if (msgPref.allowed && cfg.autopilotMode !== "OFF") {
    const draftMode = cfg.guestMessaging.guestMessageMode;
    actions.push({
      id: "message_draft:pipeline",
      kind: "message_draft",
      title: "Guest message drafts",
      explanation:
        draftMode === "draft_only"
          ? "Autopilot prepares lifecycle drafts (confirmation, check-in, checkout). Nothing is sent until you send from inbox."
          : "Auto-send is limited to safe templates you enabled; you can switch to draft-only anytime.",
      confidence: 0.64,
      risk: draftMode === "draft_only" ? "low" : "medium",
      executionHint: "suggest_only",
      metadata: { guestMessageMode: draftMode },
    });
  }

  // Booking recommendations — never auto-accept
  const bookingRule = ruleNeverAutoAcceptBookings();
  rulesApplied.push("no_auto_booking_accept");
  for (const b of context.bookingsAwaitingApproval.slice(0, 5)) {
    const highValue = b.totalCents >= 250_000;
    actions.push({
      id: `booking_review:${b.id}`,
      kind: "booking_recommendation",
      title: `Review booking request · ${b.listingTitle.slice(0, 40)}${b.listingTitle.length > 40 ? "…" : ""}`,
      explanation: `${bookingRule.reason} ${highValue ? "Higher-value requests warrant an explicit host decision." : "Open the booking to see guest details and calendar fit."}`,
      confidence: highValue ? 0.82 : 0.7,
      risk: highValue ? "high" : "medium",
      executionHint: "manual_only",
      target: { entityType: "booking", entityId: b.id },
      metadata: { awaitingHours: (Date.now() - b.createdAt.getTime()) / 3600000 },
    });
  }

  let riskLevel: AutopilotRiskLevel = "low";
  for (const a of actions) {
    riskLevel = maxRisk(riskLevel, a.risk);
  }

  const overallConfidence =
    actions.length === 0 ? 0.5 : actions.reduce((s, a) => s + a.confidence, 0) / actions.length;

  const summary =
    actions.length === 0
      ? "No prioritized actions right now — your listings and queue look calm."
      : `${actions.length} guided action(s). All explanations are shown below; nothing risky runs without your control.`;

  return {
    actions: actions.slice(0, 12),
    overallConfidence: Math.round(overallConfidence * 100) / 100,
    riskLevel,
    summary,
    rulesApplied,
  };
}
