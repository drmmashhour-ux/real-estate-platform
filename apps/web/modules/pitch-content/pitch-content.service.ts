import type { ThreeMonthProjection } from "@/modules/launch-simulation/launch-simulation.types";
import { buildFullInvestorNarrative } from "@/modules/investor-narrative/investor-narrative.service";
import type { PitchDeckContent } from "./pitch-content.types";
import {
  buildCompetitiveSlide,
  buildSlide9ProjectionCopy,
  buildTitleSlide,
  buildTractionSlide,
} from "./slide-copy.service";

/**
 * 12-slide deck — combines narrative + simulation outputs (estimates clearly labeled).
 */
export function buildPitchDeckContent(input: {
  conservative: ThreeMonthProjection;
  baseline: ThreeMonthProjection;
  optimistic: ThreeMonthProjection;
  actualTractionNote?: string | null;
}): PitchDeckContent {
  const nar = buildFullInvestorNarrative();
  const b = nar.blocks;

  const slides = [
    buildTitleSlide(),
    {
      slideNumber: 2,
      title: "Problem",
      headline: "Fragmentation + execution gap",
      bullets: [
        "Residential brokerage and STR operations run on disconnected tools.",
        "Execution intelligence is shallow; manual work compounds compliance risk.",
        "Trust and fee transparency suffer when guests and clients see inconsistent receipts.",
      ],
      speakerNotes: b.problem,
      optionalVisualSuggestion: "Diagram: many tools vs single OS.",
    },
    {
      slideNumber: 3,
      title: "Solution",
      headline: "LECIPM as an AI operating system",
      bullets: [
        "Unified brokerage + BNHub marketplace + execution + compliance + growth loops (feature-flagged).",
        "AI assists drafting and insights; humans approve high-impact outputs.",
      ],
      speakerNotes: b.differentiation,
    },
    {
      slideNumber: 4,
      title: "Product",
      headline: "What ships",
      bullets: [
        "Broker workflow engine + deal workspace patterns",
        "AI contract/drafting assistance (review-first)",
        "BNHub marketplace + host tools + trust layers",
      ],
      speakerNotes: "Map to modules you actually run in prod; avoid vapor features.",
    },
    {
      slideNumber: 5,
      title: "Market",
      headline: "Montreal first",
      bullets: [
        b.whyMontreal,
        "Expand neighbourhood-by-neighbourhood with density before widening geography.",
        "Residential resale + STR wedge reduces cold-start across two demand engines.",
      ],
      speakerNotes: b.whyScales,
    },
    {
      slideNumber: 6,
      title: "Business Model",
      headline: "Multi-engine revenue",
      bullets: [
        "BNHub: booking-related fees + host subscriptions + boosts/promotions (configuration-driven).",
        "Brokerage: subscriptions + pay-per-lead + success fees (+ optional AI/doc envelope).",
      ],
      speakerNotes: b.revenueEarly,
    },
    buildTractionSlide(input.actualTractionNote),
    buildCompetitiveSlide(),
    buildSlide9ProjectionCopy(input.conservative, input.baseline, input.optimistic),
    {
      slideNumber: 10,
      title: "Go-To-Market",
      headline: "First hosts + first brokers",
      bullets: [
        "First ~50 hosts in priority Montreal zones — compliant outreach (Law 25 / consent).",
        "Broker teams onboarded with CRM + lead economics aligned to configured price anchors.",
        "Referral/growth loops tied to product events (no spam automation).",
      ],
      speakerNotes: "Connect to your acquisition CRM — numbers are process goals, not promises.",
    },
    {
      slideNumber: 11,
      title: "Why We Win",
      headline: "Moats that compound",
      bullets: [b.moat, "Compliance/trust depth suitable for Québec brokerage practice patterns.", "Stripe-verified money movement + audit trails."],
      speakerNotes: b.differentiation,
    },
    {
      slideNumber: 12,
      title: "Ask",
      headline: "Use of funds & milestones",
      bullets: [
        "Specify round size and runway — tie to hiring GTM + engineering + compliance review.",
        "Milestones: Montreal supply/demand thresholds you will measure honestly.",
      ],
      speakerNotes: "Keep legal/financial terms out of this deck body — point to data room.",
    },
  ];

  return {
    kind: "pitch_content_estimate",
    generatedAt: new Date().toISOString(),
    companyName: nar.positioning.tagline.split(" —")[0] ?? "LECIPM",
    slides,
    disclaimers: [
      "This deck content includes **estimated** revenue scenarios — not audited financials.",
      nar.risks.join(" "),
    ],
  };
}
