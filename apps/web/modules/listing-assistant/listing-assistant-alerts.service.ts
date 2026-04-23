import { checkListingCompliance } from "@/modules/listing-assistant/listing-compliance.checker";
import { computeListingReadiness } from "@/modules/listing-assistant/listing-readiness.service";
import type { ListingAssistantContentSnapshot } from "@/modules/listing-assistant/listing-version.types";
import type { PricingSuggestionResult } from "@/modules/listing-assistant/listing-assistant.types";

export type ListingAssistantAlertSeverity = "info" | "warning" | "critical";

export type ListingAssistantAlert = {
  id: string;
  severity: ListingAssistantAlertSeverity;
  title: string;
  detail: string;
  listingId?: string;
};

export function evaluateListingAssistantAlerts(params: {
  listingId?: string;
  snapshot: ListingAssistantContentSnapshot;
  pricing?: PricingSuggestionResult | null;
}): ListingAssistantAlert[] {
  const compliance = checkListingCompliance({
    title: params.snapshot.title,
    description: params.snapshot.description,
    highlights: params.snapshot.propertyHighlights,
  });

  const readiness = computeListingReadiness({
    content: {
      title: params.snapshot.title,
      description: params.snapshot.description,
      propertyHighlights: params.snapshot.propertyHighlights,
      language: params.snapshot.language,
    },
    compliance,
    pricing: params.pricing ?? null,
    partial: {},
  });

  const alerts: ListingAssistantAlert[] = [];
  const lid = params.listingId ?? "draft";

  if (readiness.readinessStatus === "HIGH_RISK") {
    alerts.push({
      id: `${lid}:high_risk`,
      severity: "critical",
      title: "High-risk draft language",
      detail:
        readiness.topBlockers[0] ??
        "Compliance flagged high textual risk — broker edits mandatory before syndication discussions.",
      listingId: params.listingId,
    });
  }

  if (params.pricing?.thinDataWarning || params.pricing?.confidenceLevel === "LOW") {
    alerts.push({
      id: `${lid}:pricing_thin`,
      severity: "warning",
      title: "Pricing confidence limited",
      detail:
        params.pricing?.thinDataWarning ?
          `Only ${params.pricing.comparableCount} CRM peers matched — widen comps manually before relying on band.`
        : "Treat suggested band as illustrative.",
      listingId: params.listingId,
    });
  }

  if (readiness.readinessStatus === "READY" && readiness.readinessScore >= 78) {
    alerts.push({
      id: `${lid}:ready_review`,
      severity: "info",
      title: "Ready for structured broker review",
      detail: "Readiness gates green — paste into CRM draft fields after your compliance review checklist.",
      listingId: params.listingId,
    });
  }

  return alerts;
}
