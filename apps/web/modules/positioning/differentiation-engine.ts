import type { CompetitorId } from "./competitor-analysis.service";

export type DifferentiationAxis =
  | "ai_automation"
  | "trust_compliance"
  | "broker_integration"
  | "ecosystem"
  | "revenue_stack";

export type DifferentiationRow = {
  axis: DifferentiationAxis;
  lecipmCapability: string;
  competitorGap: string;
};

const AXIS_COPY: Record<DifferentiationAxis, { lecipm: string; gap: Record<CompetitorId, string> }> = {
  ai_automation: {
    lecipm: "AI-assisted drafting and workflows with human review gates (broker/seller-controlled).",
    gap: {
      airbnb: "OTA focuses on booking UX, not Québec resale document workflows.",
      centris: "Distribution-first; not an AI deal workspace.",
      generic_mls: "IDX is browse-heavy; limited execution copilot.",
    },
  },
  trust_compliance: {
    lecipm: "Consent logs, audit trails, Law 25-aware patterns for Canadian operations.",
    gap: {
      airbnb: "STR trust tools ≠ brokerage compliance archive.",
      centris: "Listing accuracy depends on upstream brokerage input.",
      generic_mls: "Varies by vendor; not a unified trust graph.",
    },
  },
  broker_integration: {
    lecipm: "Residential broker CRM + deal rooms on one platform identity.",
    gap: {
      airbnb: "No broker deal OS for resale in Québec.",
      centris: "Not a broker operating system.",
      generic_mls: "Rarely includes STR + resale in one stack.",
    },
  },
  ecosystem: {
    lecipm: "BNHub (STR) + brokerage resale + payments pathways where product supports.",
    gap: {
      airbnb: "STR-only ecosystem.",
      centris: "Search portal, not hospitality + brokerage stack.",
      generic_mls: "Narrow slice of journey.",
    },
  },
  revenue_stack: {
    lecipm: "Transparent fee surfaces for BNHub + brokerage monetization hooks (where enabled).",
    gap: {
      airbnb: "Host/guest fees for stays only.",
      centris: "Brokerage economics sit outside the portal.",
      generic_mls: "Typically subscription/lead-gen, not full-stack.",
    },
  },
};

export function buildDifferentiationMatrix(competitor: CompetitorId): DifferentiationRow[] {
  return (Object.keys(AXIS_COPY) as DifferentiationAxis[]).map((axis) => ({
    axis,
    lecipmCapability: AXIS_COPY[axis].lecipm,
    competitorGap: AXIS_COPY[axis].gap[competitor],
  }));
}
