/**
 * Broker acquisition — highlights platform workflow + compliance (no fabricated ROI).
 */

import type { MontrealOpportunityRow } from "@/modules/market-intelligence/market-intelligence.types";

export type BrokerPreviewDraft = {
  title: string;
  bullets: string[];
  cta: string;
  reviewRequired: true;
};

export function buildBrokerRoiPreview(_market?: MontrealOpportunityRow | null): BrokerPreviewDraft {
  void _market;
  return {
    title: "Broker workspace on LECIPM — Québec-ready workflows",
    bullets: [
      "Centralize listings, documents, and client comms with audit-friendly trails.",
      "BNHUB stays remain on Stripe; brokerage resale flows stay distinct and consent-aware.",
      "Use internal funnel analytics to see inquiry → deal progression for your team (aggregated).",
    ],
    cta: "Book an onboarding call — drafts are not sent automatically.",
    reviewRequired: true,
  };
}
