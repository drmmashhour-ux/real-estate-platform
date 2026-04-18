/**
 * Landing funnel diagnostics from growth_events aggregates — recommendations only.
 */

import { classifyEvidenceQuality, computeEvidenceScore } from "./ads-evidence-score.service";
import type { EvidenceQuality } from "./ads-automation-v4.types";

export type LandingOptimizationRecommendation = {
  kind: "cta_headline" | "form_friction" | "trust_listing" | "healthy" | "insufficient_data";
  message: string;
  confidence: number;
  evidence: string;
  issueType: string;
  severity: "low" | "medium" | "high";
  evidenceScore: number;
  evidenceQuality: EvidenceQuality;
  reasons: string[];
  operatorAction: string;
  recommendedExperiments: string[];
  metricsSnapshot: {
    impressions: number;
    clicks: number;
    leads: number;
    bookingsCompleted: number;
  };
};

function ratio(num: number, den: number): number {
  if (den <= 0) return 0;
  return num / den;
}

function baseEvidence(input: {
  impressions: number;
  clicks: number;
  leads: number;
  bookingsCompleted: number;
}): number {
  return computeEvidenceScore({
    impressions: input.impressions,
    clicks: input.clicks,
    leads: input.leads,
    spendKnown: false,
    cplComputable: false,
    conversionComputable: input.bookingsCompleted > 0 || input.leads > 3,
    windowDays: 14,
  });
}

/**
 * Uses landing views → CTA clicks → leads → bookings chain.
 */
export function analyzeLandingFeedbackLoop(input: {
  impressions: number;
  clicks: number;
  leads: number;
  bookingsCompleted: number;
}): LandingOptimizationRecommendation[] {
  const { impressions, clicks, leads, bookingsCompleted } = input;
  const out: LandingOptimizationRecommendation[] = [];
  const ms = { impressions, clicks, leads, bookingsCompleted };

  if (impressions < 30) {
    const ev = baseEvidence(ms);
    out.push({
      kind: "insufficient_data",
      message: "Not enough landing views yet — wait for ~50+ views before changing hero or CTA.",
      confidence: 0.4,
      evidence: `impressions=${impressions}`,
      issueType: "insufficient_data",
      severity: "low",
      evidenceScore: ev,
      evidenceQuality: classifyEvidenceQuality(ev),
      reasons: ["Below minimum views for reliable funnel reads."],
      operatorAction: "Keep tracking; avoid large creative or CMS changes until volume increases.",
      recommendedExperiments: [],
      metricsSnapshot: ms,
    });
    return out;
  }

  const clickRate = ratio(clicks, impressions);
  const leadRate = ratio(leads, Math.max(1, clicks));
  const bookingRate = ratio(bookingsCompleted, Math.max(1, leads));

  if (clickRate < 0.02 && impressions >= 50) {
    const ev = baseEvidence(ms);
    out.push({
      kind: "cta_headline",
      message: "High views but weak CTA clicks — test hero headline + primary CTA label; keep offer constant.",
      confidence: 0.72,
      evidence: `CTR proxy ${(clickRate * 100).toFixed(2)}% (cta_click / landing_view)`,
      issueType: "cta_headline",
      severity: "high",
      evidenceScore: ev,
      evidenceQuality: classifyEvidenceQuality(ev),
      reasons: [
        `Click rate from views is ${(clickRate * 100).toFixed(2)}% — below typical exploration threshold.`,
        "Strong view volume supports an A/B on hero + CTA copy.",
      ],
      operatorAction: "Run a controlled headline/CTA test in CMS; keep URL and offer identical.",
      recommendedExperiments: ["Hero headline A/B", "Primary CTA label only variant"],
      metricsSnapshot: ms,
    });
  }

  if (clicks >= 20 && leadRate < 0.08) {
    const ev = baseEvidence(ms);
    out.push({
      kind: "form_friction",
      message: "Clicks without leads — shorten form, clarify value, reduce fields; check mobile layout.",
      confidence: 0.68,
      evidence: `lead/click ${(leadRate * 100).toFixed(1)}%`,
      issueType: "form_friction",
      severity: "medium",
      evidenceScore: ev,
      evidenceQuality: classifyEvidenceQuality(ev),
      reasons: [`Lead rate per click ${(leadRate * 100).toFixed(1)}% suggests capture friction.`],
      operatorAction: "Audit form fields, validation errors, and mobile keyboard behavior.",
      recommendedExperiments: ["Short form vs current", "Single-step email capture test"],
      metricsSnapshot: ms,
    });
  }

  if (leads >= 10 && bookingRate < 0.15) {
    const ev = baseEvidence(ms);
    out.push({
      kind: "trust_listing",
      message: "Leads not converting to bookings — review listing truth, price, photos, and BNHub trust cues.",
      confidence: 0.65,
      evidence: `booking/lead ${(bookingRate * 100).toFixed(1)}%`,
      issueType: "trust_listing",
      severity: "medium",
      evidenceScore: ev,
      evidenceQuality: classifyEvidenceQuality(ev),
      reasons: [`Booking rate per lead ${(bookingRate * 100).toFixed(1)}% — downstream conversion pressure.`],
      operatorAction: "Verify listing accuracy, pricing clarity, and checkout friction with ops.",
      recommendedExperiments: ["Trust strip on landing", "Checkout step analytics review"],
      metricsSnapshot: ms,
    });
  }

  if (out.length === 0) {
    const ev = baseEvidence(ms);
    out.push({
      kind: "healthy",
      message: "No strong funnel friction signal in this window — keep monitoring weekly.",
      confidence: 0.55,
      evidence: `views=${impressions}, clicks=${clicks}, leads=${leads}, bookings=${bookingsCompleted}`,
      issueType: "healthy",
      severity: "low",
      evidenceScore: ev,
      evidenceQuality: classifyEvidenceQuality(ev),
      reasons: ["No rule fired for headline, form, or trust issues at current volumes."],
      operatorAction: "Maintain cadence; re-run loop after more events accrue.",
      recommendedExperiments: [],
      metricsSnapshot: ms,
    });
  }

  return out;
}
